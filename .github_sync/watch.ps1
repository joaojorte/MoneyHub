# MoneyHub - Monitor em tempo real para sincronizacao automatica com GitHub / Vercel
$folder = "c:\Users\Maria\Downloads\MoneyHub"
$syncScript = "c:\Users\Maria\Downloads\MoneyHub\.github_sync\sync.ps1"

Write-Host "=========================================================="
Write-Host " Monitorando alteracoes em: $folder"
Write-Host " Sempre que um arquivo for salvo, ele subira para o GitHub!"
Write-Host " Pressione Ctrl + C para encerrar o monitor."
Write-Host "=========================================================="

$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path = $folder
$fsw.IncludeSubdirectories = $true
$fsw.EnableRaisingEvents = $true
$fsw.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::FileName

$ultimoDisparo = [DateTime]::MinValue

$action = {
    param($source, $event)
    $caminho = $event.FullPath
    
    # Ignorar arquivos temporarios ou do proprio sync
    if ($caminho -like "*\.github_sync*" -or $caminho -like "*\.vscode*" -or $caminho -like "*\.git*") {
        return
    }

    # Debounce de 3 segundos para evitar disparos repetidos no mesmo salvamento
    $agora = [DateTime]::Now
    if (($agora - $script:ultimoDisparo).TotalSeconds -lt 3) { return }
    $script:ultimoDisparo = $agora

    Write-Host "`n[Alteracao detectada] $caminho"
    Start-Sleep -Seconds 1
    & powershell.exe -ExecutionPolicy Bypass -File $syncScript
}

Register-ObjectEvent $fsw "Changed" -Action $action | Out-Null
Register-ObjectEvent $fsw "Created" -Action $action | Out-Null

try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    Unregister-Event -SourceIdentifier $action.Id -ErrorAction SilentlyContinue
    $fsw.Dispose()
}
