<#
.SYNOPSIS
  Migra dados do Firestore do Organiza Contas (somente leitura) para o Firestore do Planejador Financeiro.

.DESCRIPTION
  Le users/managements/cards/transactions do projeto de origem (organiza-contas-76388) via
  API REST do Firestore e grava (upsert) os registros equivalentes no projeto de destino
  (planejador-financeiro-bfd79), usando o mapeamento de UIDs ja gerado pela migracao do
  Firebase Auth (.migration/uid-map.json).

  GARANTIAS:
  - NUNCA escreve, atualiza ou apaga nada no projeto de origem (Organiza Contas). Todas as
    chamadas ao projeto de origem sao GET.
  - Idempotente: cada registro migrado recebe um ID deterministico (hash estavel a partir de
    IDs de origem). Antes de escrever, o script verifica se o documento ja existe no destino
    e, se existir, NAO o sobrescreve — apenas conta como "ja existente". Rodar o script varias
    vezes nao duplica nem reescreve registros ja migrados.
  - Roda em modo DRY-RUN por padrao (nenhuma escrita real). Use -Apply para gravar de fato.

.PARAMETER Apply
  Sem este parametro, o script apenas lê a origem e simula a migração, imprimindo os totais
  sem gravar nada no destino. Com -Apply, grava de fato os documentos novos no destino.
#>
param([switch]$Apply)

$ErrorActionPreference = "Stop"
$sourceProject = "organiza-contas-76388"
$targetProject = "planejador-financeiro-bfd79"
$tokenFile = "C:\Users\Guilherme.carvalho\.config\configstore\firebase-tools.json"
$uidMapFile = Join-Path $PSScriptRoot "..\.migration\uid-map.json"

if (-not (Test-Path -LiteralPath $uidMapFile)) { throw "Execute primeiro a exportacao/importacao de usuarios; uid-map.json nao foi encontrado." }
$tokenConfig = Get-Content -LiteralPath $tokenFile -Raw | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($tokenConfig.tokens.access_token)" }
# ConvertFrom-Json -AsHashtable exige PowerShell 7+; construimos a hashtable manualmente
# para funcionar tambem no Windows PowerShell 5.1.
$uidMapRaw = Get-Content -LiteralPath $uidMapFile -Raw | ConvertFrom-Json
$uidMap = @{}
$uidMapRaw.PSObject.Properties | ForEach-Object { $uidMap[$_.Name] = [string]$_.Value }

# Contadores para o relatorio final (requisito: encontrados / importados / ja existentes / ignorados / erros)
$script:stats = [ordered]@{
  usersFound = 0; usersCreated = 0; usersExisting = 0; usersErrors = 0
  managementsFound = 0
  accountsCreated = 0; accountsExisting = 0; accountsErrors = 0
  categoriesCreated = 0; categoriesExisting = 0; categoriesErrors = 0
  cardsFound = 0; cardsCreated = 0; cardsExisting = 0; cardsErrors = 0
  transactionsFound = 0; transactionsCreated = 0; transactionsExisting = 0; transactionsSkippedInvalid = 0; transactionsErrors = 0
}
$script:errorLog = [System.Collections.Generic.List[string]]::new()

function Convert-FirestoreValue($value) {
  if ($null -eq $value) { return $null }
  $properties = $value.PSObject.Properties
  if ($properties['nullValue']) { return $null }
  if ($properties['stringValue']) { return [string]$value.stringValue }
  if ($properties['integerValue']) { return [long]$value.integerValue }
  if ($properties['doubleValue']) { return [double]$value.doubleValue }
  if ($properties['booleanValue']) { return [bool]$value.booleanValue }
  if ($properties['timestampValue']) { return [string]$value.timestampValue }
  if ($properties['arrayValue']) { return @($value.arrayValue.values | ForEach-Object { Convert-FirestoreValue $_ }) }
  if ($properties['mapValue']) {
    $map = [ordered]@{}
    if ($value.mapValue.fields) { $value.mapValue.fields.PSObject.Properties | ForEach-Object { $map[$_.Name] = Convert-FirestoreValue $_.Value } }
    return $map
  }
  return $null
}

function Convert-FirestoreDocument($document) {
  $data = [ordered]@{ id = ($document.name -split '/')[-1] }
  if ($document.fields) {
    foreach ($property in $document.fields.PSObject.Properties) {
      $propertyName = [string]$property.Name
      if ($propertyName) { $data[$propertyName] = Convert-FirestoreValue $property.Value }
    }
  }
  return $data
}

function Convert-ToFirestoreValue($value) {
  if ($null -eq $value) { return @{ nullValue = $null } }
  if ($value -is [bool]) { return @{ booleanValue = $value } }
  if ($value -is [byte] -or $value -is [int16] -or $value -is [int32] -or $value -is [int64]) { return @{ integerValue = [string]$value } }
  if ($value -is [single] -or $value -is [double] -or $value -is [decimal]) { return @{ doubleValue = [double]$value } }
  if ($value -is [System.Collections.IDictionary] -or ($value -is [pscustomobject])) {
    $fields = [ordered]@{}
    if ($value -is [System.Collections.IDictionary]) { $value.Keys | ForEach-Object { $fields[$_] = Convert-ToFirestoreValue $value[$_] } }
    else { $value.PSObject.Properties | ForEach-Object { $fields[$_.Name] = Convert-ToFirestoreValue $_.Value } }
    return @{ mapValue = @{ fields = $fields } }
  }
  if ($value -is [System.Collections.IEnumerable] -and $value -isnot [string]) { return @{ arrayValue = @{ values = @($value | ForEach-Object { Convert-ToFirestoreValue $_ }) } } }
  return @{ stringValue = [string]$value }
}

# --- Somente LEITURA no projeto de origem (Organiza Contas). Nenhuma funcao abaixo grava no source. ---
function Get-Documents([string]$project, [string]$path) {
  $items = [System.Collections.Generic.List[object]]::new(); $pageToken = $null
  do {
    $uri = "https://firestore.googleapis.com/v1/projects/$project/databases/(default)/documents/${path}?pageSize=100"
    if ($pageToken) { $uri += "&pageToken=$([uri]::EscapeDataString($pageToken))" }
    try { $response = Invoke-RestMethod -Headers $headers -Uri $uri } catch { if ($_.Exception.Response.StatusCode.value__ -eq 404) { return @() }; throw }
    foreach ($document in @($response.documents)) { $items.Add((Convert-FirestoreDocument $document)) }
    $pageToken = $response.nextPageToken
  } while ($pageToken)
  return $items.ToArray()
}

function Test-Document([string]$project, [string]$path) {
  try { Invoke-RestMethod -Headers $headers -Uri "https://firestore.googleapis.com/v1/projects/$project/databases/(default)/documents/$path" | Out-Null; return $true } catch { if ($_.Exception.Response.StatusCode.value__ -eq 404) { return $false }; throw }
}

# Grava (cria) um documento no projeto de DESTINO. Nunca chamada com $targetProject apontando para a origem.
function Write-Document([string]$collection, [string]$id, [System.Collections.IDictionary]$data) {
  if (-not $Apply) { return }
  $fields = [ordered]@{}; $data.Keys | ForEach-Object { $fields[$_] = Convert-ToFirestoreValue $data[$_] }
  $body = @{ fields = $fields } | ConvertTo-Json -Depth 40 -Compress
  $uri = "https://firestore.googleapis.com/v1/projects/$targetProject/databases/(default)/documents/$collection/$([uri]::EscapeDataString($id))"
  Invoke-RestMethod -Method Patch -Headers $headers -ContentType "application/json" -Uri $uri -Body $body | Out-Null
}

# Upsert idempotente: se o documento de destino ja existe, NAO sobrescreve (evita duplicar/reprocessar em reexecucoes).
function Write-IfMissing([string]$collection, [string]$id, [System.Collections.IDictionary]$data, [string]$counterPrefix) {
  try {
    if (Test-Document $targetProject "$collection/$id") {
      $script:stats["${counterPrefix}Existing"]++
      return
    }
    Write-Document $collection $id $data
    $script:stats["${counterPrefix}Created"]++
  } catch {
    $script:stats["${counterPrefix}Errors"]++
    $script:errorLog.Add("[$collection/$id] $($_.Exception.Message)")
  }
}

function Get-StableId([string]$prefix, [string]$seed) {
  $sha = [System.Security.Cryptography.SHA256]::Create(); try { $bytes = [Text.Encoding]::UTF8.GetBytes($seed); $hash = $sha.ComputeHash($bytes); return "$prefix$(([BitConverter]::ToString($hash)).Replace('-', '').Substring(0, 28).ToLowerInvariant())" } finally { $sha.Dispose() }
}

function Get-IsoDate($value, $fallback) {
  $text = [string]$value
  if (-not $text) { $text = [string]$fallback }
  if (-not $text) { return (Get-Date).ToUniversalTime().ToString('o') }
  if ($text -match '^\d{4}-\d{2}-\d{2}$') { return "$text`T12:00:00.000Z" }
  try { return ([datetime]$text).ToUniversalTime().ToString('o') } catch { return (Get-Date).ToUniversalTime().ToString('o') }
}

Write-Host "Lendo dados de ORIGEM (somente leitura): $sourceProject ..." -ForegroundColor Cyan
$sourceUsers = Get-Documents $sourceProject "users"
$managements = Get-Documents $sourceProject "managements"
$script:stats.usersFound = $sourceUsers.Count
$script:stats.managementsFound = $managements.Count

foreach ($sourceUser in $sourceUsers) {
  $targetUid = if ($uidMap.ContainsKey($sourceUser.id)) { $uidMap[$sourceUser.id] } else { $sourceUser.id }
  Write-IfMissing "users" $targetUid ([ordered]@{
    name = [string]$sourceUser.name
    email = [string]$sourceUser.email
    preferences = [ordered]@{ themeMode = "light"; currency = "BRL"; accentColor = "#0F7B5C"; monthlyExpenseLimitCents = $null }
    migrationSource = [ordered]@{ projectId = $sourceProject; sourceUserId = $sourceUser.id; migratedAt = (Get-Date).ToUniversalTime().ToString('o') }
  }) "users"
}

foreach ($management in $managements) {
  $transactions = Get-Documents $sourceProject "managements/$($management.id)/transactions"
  $cards = Get-Documents $sourceProject "managements/$($management.id)/cards"
  $script:stats.transactionsFound += $transactions.Count
  $script:stats.cardsFound += $cards.Count

  foreach ($sourceMemberId in @($management.memberIds)) {
    $targetUid = if ($uidMap.ContainsKey([string]$sourceMemberId)) { $uidMap[[string]$sourceMemberId] } else { [string]$sourceMemberId }
    $accountId = Get-StableId "migacc_" "$targetUid|$($management.id)"
    $opening = 0; if ($management.cashPlanning -and $management.cashPlanning.currentBalance) { $opening = [math]::Round([double]$management.cashPlanning.currentBalance * 100) }
    Write-IfMissing "accounts" $accountId ([ordered]@{
      userId = $targetUid; name = "OrganizaContas · $($management.name)"; type = "corrente"; color = "#0F7B5C"; icon = "landmark"
      initialBalanceCents = $opening; archived = $false; createdAt = Get-IsoDate $management.createdAt $null
      migrationSource = [ordered]@{ projectId = $sourceProject; managementId = $management.id; description = $management.description; cashPlanning = $management.cashPlanning; expenseLimits = $management.expenseLimits; memberIds = $management.memberIds }
    }) "accounts"

    $categoryIds = @{}
    foreach ($transaction in $transactions) {
      $kind = if ($transaction.type -eq "income") { "receita" } else { "despesa" }
      $categoryName = if ($transaction.category) { [string]$transaction.category } else { if ($kind -eq "receita") { "Outras receitas" } else { "Outros" } }
      $categoryKey = "$kind|$categoryName"
      if (-not $categoryIds.ContainsKey($categoryKey)) {
        $categoryId = Get-StableId "migcat_" "$targetUid|$categoryKey"; $categoryIds[$categoryKey] = $categoryId
        Write-IfMissing "categories" $categoryId ([ordered]@{
          userId = $targetUid; name = $categoryName; kind = $kind
          color = if ($kind -eq "receita") { "#0F7B5C" } else { "#E5484D" }
          icon = if ($kind -eq "receita") { "wallet" } else { "receipt" }
          isDefault = $false; migrationSource = [ordered]@{ projectId = $sourceProject }
        }) "categories"
      }
    }

    $cardIds = @{}
    foreach ($sourceCard in $cards) {
      $cardId = Get-StableId "migcard_" "$targetUid|$($management.id)|$($sourceCard.id)"; $cardIds[$sourceCard.id] = $cardId
      $closingRaw = if ($sourceCard.closingDay) { $sourceCard.closingDay } else { 1 }; $dueRaw = if ($sourceCard.dueDay) { $sourceCard.dueDay } else { 1 }
      $closing = [math]::Min(28, [math]::Max(1, [int]$closingRaw)); $due = [math]::Min(28, [math]::Max(1, [int]$dueRaw))
      Write-IfMissing "cards" $cardId ([ordered]@{
        userId = $targetUid; name = [string]$sourceCard.name; holderName = [string]$sourceCard.holderName; logoUrl = [string]$sourceCard.logoUrl
        bank = "OrganizaContas"; color = if ($sourceCard.backgroundColor) { [string]$sourceCard.backgroundColor } else { "#0F7B5C" }
        brand = "outra"; limitCents = 0; closingDay = $closing; dueDay = $due; archived = ($sourceCard.active -eq $false)
        createdAt = Get-IsoDate $sourceCard.createdAt $null
        migrationSource = [ordered]@{ projectId = $sourceProject; managementId = $management.id; sourceCardId = $sourceCard.id }
      }) "cards"
    }

    foreach ($transaction in $transactions) {
      if (-not $transaction.description -or $null -eq $transaction.amount) {
        $script:stats.transactionsSkippedInvalid++
        $script:errorLog.Add("[transactions/$($transaction.id)] ignorado: sem descricao ou valor")
        continue
      }
      $kind = if ($transaction.type -eq "income") { "receita" } else { "despesa" }
      $categoryName = if ($transaction.category) { [string]$transaction.category } else { if ($kind -eq "receita") { "Outras receitas" } else { "Outros" } }
      $categoryId = $categoryIds["$kind|$categoryName"]
      $planned = Get-IsoDate $transaction.plannedDate $transaction.dueDate; $dueDate = Get-IsoDate $transaction.dueDate $transaction.plannedDate
      $status = if ($transaction.status -eq "paid") { if ($kind -eq "receita") { "recebido" } else { "pago" } } else { "pendente" }
      $priority = if ($transaction.priority -eq "essential") { "essencial" } elseif ($transaction.priority -eq "flexible") { "flexivel" } else { "importante" }
      $transactionId = Get-StableId "migtxn_" "$targetUid|$($management.id)|$($transaction.id)"
      $data = [ordered]@{
        userId = $targetUid; accountId = $accountId; categoryId = $categoryId; type = $kind
        amountCents = [math]::Round([double]$transaction.amount * 100)
        description = [string]$transaction.description; date = $planned; dueDate = $dueDate; plannedDate = $planned; status = $status
        priority = if ($kind -eq "despesa") { $priority } else { $null }
        cardId = if ($transaction.cardId -and $cardIds.ContainsKey([string]$transaction.cardId)) { $cardIds[[string]$transaction.cardId] } else { $null }
        notes = [string]$transaction.notes; createdAt = Get-IsoDate $transaction.createdAt $planned
        migrationSource = [ordered]@{
          projectId = $sourceProject; managementId = $management.id; sourceTransactionId = $transaction.id; sourceCreatedBy = $transaction.createdBy
          attachment = $transaction.attachment; recurrenceGroupId = $transaction.recurrenceGroupId; recurrenceIndex = $transaction.recurrenceIndex
          recurrenceTotal = $transaction.recurrenceTotal; allowLatePayment = $transaction.allowLatePayment; maxDelayDays = $transaction.maxDelayDays; lateFeePercent = $transaction.lateFeePercent
        }
      }
      if ($status -ne "pendente" -and $transaction.paidDate) { $data.settledAt = Get-IsoDate $transaction.paidDate $planned }
      Write-IfMissing "transactions" $transactionId $data "transactions"
    }
  }
}

$mode = if ($Apply) { "APPLY (gravacao real no destino)" } else { "DRY-RUN (nenhuma gravacao)" }
Write-Host ""
Write-Host "===== RELATORIO DA MIGRACAO =====" -ForegroundColor Cyan
Write-Host "MODO: $mode"
Write-Host "Origem (somente leitura): $sourceProject"
Write-Host "Destino: $targetProject"
Write-Host ""
Write-Host "Usuarios      -> encontrados: $($stats.usersFound)   novos: $($stats.usersCreated)   ja existentes: $($stats.usersExisting)   erros: $($stats.usersErrors)"
Write-Host "Managements   -> encontrados: $($stats.managementsFound)"
Write-Host "Contas        -> novas: $($stats.accountsCreated)   ja existentes: $($stats.accountsExisting)   erros: $($stats.accountsErrors)"
Write-Host "Categorias    -> novas: $($stats.categoriesCreated)   ja existentes: $($stats.categoriesExisting)   erros: $($stats.categoriesErrors)"
Write-Host "Cartoes       -> encontrados: $($stats.cardsFound)   novos: $($stats.cardsCreated)   ja existentes: $($stats.cardsExisting)   erros: $($stats.cardsErrors)"
Write-Host "Lancamentos   -> encontrados: $($stats.transactionsFound)   novos: $($stats.transactionsCreated)   ja existentes: $($stats.transactionsExisting)   ignorados (invalidos): $($stats.transactionsSkippedInvalid)   erros: $($stats.transactionsErrors)"
if ($script:errorLog.Count -gt 0) {
  Write-Host ""
  Write-Host "Detalhe dos erros/ignorados:" -ForegroundColor Yellow
  $script:errorLog | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}
Write-Host ""
if (-not $Apply) { Write-Host "Nenhuma gravacao foi feita (dry-run). Rode novamente com -Apply para migrar de fato." -ForegroundColor Yellow }
