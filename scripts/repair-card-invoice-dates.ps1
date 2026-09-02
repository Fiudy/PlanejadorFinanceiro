param([switch]$Apply, [switch]$DeleteAll)

$ErrorActionPreference = "Stop"
$project = "planejador-financeiro-bfd79"
$email = "guilherme@hotmail.com"
$tokenFile = "C:\Users\Guilherme.carvalho\.config\configstore\firebase-tools.json"
$authExport = Join-Path $PSScriptRoot "..\.migration\planejador-users-after.json"
$token = (Get-Content -LiteralPath $tokenFile -Raw | ConvertFrom-Json).tokens.access_token
$headers = @{ Authorization = "Bearer $token" }
$users = (Get-Content -LiteralPath $authExport -Raw | ConvertFrom-Json).users
$uid = ($users | Where-Object { $_.email -eq $email } | Select-Object -First 1).localId
if (-not $uid) { throw "Usuario nao encontrado no export de autenticacao." }

function Convert-Value($value) {
  if ($null -eq $value) { return $null }
  if ($value.PSObject.Properties['stringValue']) { return [string]$value.stringValue }
  if ($value.PSObject.Properties['integerValue']) { return [int64]$value.integerValue }
  if ($value.PSObject.Properties['booleanValue']) { return [bool]$value.booleanValue }
  if ($value.PSObject.Properties['timestampValue']) { return [datetime]$value.timestampValue }
  return $null
}

function Get-Documents([string]$collection) {
  $result = [System.Collections.Generic.List[object]]::new()
  $pageToken = $null
  do {
    $uri = "https://firestore.googleapis.com/v1/projects/$project/databases/(default)/documents/${collection}?pageSize=100"
    if ($pageToken) { $uri += "&pageToken=$([uri]::EscapeDataString($pageToken))" }
    $response = Invoke-RestMethod -Headers $headers -Uri $uri
    foreach ($document in @($response.documents)) {
      $item = [ordered]@{ id = ($document.name -split '/')[-1] }
      foreach ($property in @($document.fields.PSObject.Properties)) { $item[$property.Name] = Convert-Value $property.Value }
      $result.Add([pscustomobject]$item)
    }
    $pageToken = $response.nextPageToken
  } while ($pageToken)
  return $result.ToArray()
}

function Invoice-DueDate([datetime]$purchase, [int]$closingDay, [int]$dueDay) {
  $dueMonth = Get-Date -Year $purchase.Year -Month $purchase.Month -Day 1 -Hour 12
  for ($attempt = 0; $attempt -lt 3; $attempt++) {
    $closingMonth = if ($dueDay -gt $closingDay) { $dueMonth } else { $dueMonth.AddMonths(-1) }
    $closing = Get-Date -Year $closingMonth.Year -Month $closingMonth.Month -Day ([math]::Min($closingDay, [datetime]::DaysInMonth($closingMonth.Year, $closingMonth.Month))) -Hour 12
    if ($purchase -le $closing) {
      return Get-Date -Year $dueMonth.Year -Month $dueMonth.Month -Day ([math]::Min($dueDay, [datetime]::DaysInMonth($dueMonth.Year, $dueMonth.Month))) -Hour 12
    }
    $dueMonth = $dueMonth.AddMonths(1)
  }
  return $null
}

$cards = @(Get-Documents "cards" | Where-Object { $_.userId -eq $uid })
$transactions = @(Get-Documents "transactions" | Where-Object { $_.userId -eq $uid })
$deleted = 0
if ($DeleteAll) {
  foreach ($transaction in $transactions) {
    if ($Apply) {
      $uri = "https://firestore.googleapis.com/v1/projects/$project/databases/(default)/documents/transactions/$($transaction.id)"
      Invoke-RestMethod -Method Delete -Headers $headers -Uri $uri | Out-Null
    }
    $deleted++
  }
  "MODE=$(if ($Apply) { 'DELETE-APPLY' } else { 'DELETE-DRY-RUN' })"
  "TARGET_PROJECT=$project"
  "TARGET_EMAIL=$email"
  "TRANSACTIONS_DELETED=$deleted"
  exit 0
}
$cardMap = @{}; foreach ($card in $cards) { $cardMap[$card.id] = $card }
$changes = [System.Collections.Generic.List[object]]::new()
$unlinkedExpenses = 0

foreach ($transaction in $transactions) {
  if ($transaction.type -ne "despesa") { continue }
  if (-not $transaction.cardId -or -not $cardMap.ContainsKey([string]$transaction.cardId)) { $unlinkedExpenses++; continue }
  $card = $cardMap[[string]$transaction.cardId]
  $due = Invoice-DueDate $transaction.date ([int]$card.closingDay) ([int]$card.dueDay)
  if (-not $due) { continue }
  $currentDue = [datetime]$transaction.dueDate
  if ($currentDue.Date -eq $due.Date -and ([datetime]$transaction.plannedDate).Date -eq $due.Date) { continue }
  $changes.Add([pscustomobject]@{ id = $transaction.id; description = $transaction.description; purchase = $transaction.date; previousDue = $currentDue; nextDue = $due })
  if ($Apply) {
    $timestamp = $due.ToUniversalTime().ToString("o")
    $body = @{ fields = @{ dueDate = @{ timestampValue = $timestamp }; plannedDate = @{ timestampValue = $timestamp } } } | ConvertTo-Json -Depth 8 -Compress
    $uri = "https://firestore.googleapis.com/v1/projects/$project/databases/(default)/documents/transactions/$($transaction.id)?updateMask.fieldPaths=dueDate&updateMask.fieldPaths=plannedDate"
    Invoke-RestMethod -Method Patch -Headers $headers -ContentType "application/json" -Uri $uri -Body $body | Out-Null
  }
}

"MODE=$(if ($Apply) { 'APPLY' } else { 'DRY-RUN' })"
"USER_TRANSACTIONS=$($transactions.Count)"
"USER_CARDS=$($cards.Count)"
"CARD_LINKED_TO_MOVE=$($changes.Count)"
"UNLINKED_EXPENSES=$unlinkedExpenses"
$changes | Select-Object -First 20 | ForEach-Object { "MOVE=$(([datetime]$_.purchase).ToString('yyyy-MM-dd')) -> $(([datetime]$_.nextDue).ToString('yyyy-MM-dd')) | $($_.description)" }
