$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$credentialPath = Join-Path $projectRoot 'node_modules/.cache/nita-phase3c2/resume/test-credential.clixml'
try {
  $credential = Import-Clixml -LiteralPath $credentialPath
  if ($credential -isnot [Management.Automation.PSCredential] -or $credential.UserName -cne 'nita_test_user') { throw 'Credential identity rejected' }
  $start = New-Object Diagnostics.ProcessStartInfo
  $start.FileName = (Get-Command node.exe).Source
  $start.WorkingDirectory = $projectRoot
  $start.Arguments = '--require ./tests/helpers/block-environment-files.cjs --import tsx tests/helpers/verify-disposable-postgres.ts'
  $start.UseShellExecute = $false
  # Allow only ordinary Windows process infrastructure, never inherited app settings.
  foreach ($key in @($start.EnvironmentVariables.Keys)) {
    if ($key -notmatch '^(SystemRoot|WINDIR|TEMP|TMP|PATH|PATHEXT|USERPROFILE|LOCALAPPDATA|APPDATA|USERDOMAIN|USERNAME|COMSPEC|ProgramFiles|ProgramFiles\(x86\)|ProgramData|OS|PROCESSOR_ARCHITECTURE|NUMBER_OF_PROCESSORS)$') { $start.EnvironmentVariables.Remove($key) }
  }
  $start.EnvironmentVariables['NODE_ENV'] = 'test'
  $start.EnvironmentVariables['NITA_TEST_OWNER_APPROVED'] = 'true'
  $start.EnvironmentVariables['DOTENV_CONFIG_PATH'] = Join-Path $projectRoot 'node_modules/.cache/nita-phase3c2/verified-run/no-environment-file'
  $password = $credential.GetNetworkCredential().Password
  $start.EnvironmentVariables['NITA_TEST_DATABASE_URL'] = 'postgresql://nita_test_user:' + [Uri]::EscapeDataString($password) + '@127.0.0.1:5432/nita_migration_test'
  $password = $null
  $credential = $null
  $process = [Diagnostics.Process]::Start($start)
  $process.WaitForExit()
  $result = $process.ExitCode
  $start.EnvironmentVariables.Clear()
  exit $result
} catch {
  Write-Output 'Disposable verification launcher failed; credential or process setup could not be completed. No credential details disclosed.'
  exit 1
}
