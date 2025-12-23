; Custom NSIS installer script for IMS Desktop
; This script handles SQL Server LocalDB installation with download capability

!include "LogicLib.nsh"
!include "FileFunc.nsh"

!macro customInstall
  SetDetailsPrint both
  DetailPrint "Checking for SQL Server LocalDB..."
  
  ; Check if SqlLocalDB.exe exists in PATH
  nsExec::ExecToStack 'where SqlLocalDB.exe'
  Pop $0 ; Return value
  Pop $1 ; Output path
  
  ${If} $0 != 0
    DetailPrint "SQL Server LocalDB not found. Downloading installer..."
    
    ; Create temp directory for download
    CreateDirectory "$TEMP\IMS_Setup"
    
    ; Download SQL Server Express LocalDB 2019
    ; URL for LocalDB 2019 (smaller, faster download ~50MB)
    DetailPrint "Downloading SQL Server 2019 Express LocalDB (this may take a few minutes)..."
    inetc::get /caption "Downloading SQL Server LocalDB" \
               /canceltext "Skip" \
               "https://download.microsoft.com/download/7/c/1/7c14e92e-bdcb-4f89-b7cf-93543e7112d1/SqlLocalDB.msi" \
               "$TEMP\IMS_Setup\SqlLocalDB.msi" \
               /end
    Pop $0
    
    ${If} $0 == "OK"
      DetailPrint "Download completed. Installing SQL Server LocalDB..."
      DetailPrint "This may take several minutes. Please wait..."
      
      ; Install with progress
      ExecWait '"msiexec" /i "$TEMP\IMS_Setup\SqlLocalDB.msi" /qb IACCEPTSQLLOCALDBLICENSETERMS=YES' $0
      
      ${If} $0 == 0
        DetailPrint "SQL Server LocalDB installed successfully"
        ; Clean up installer
        Delete "$TEMP\IMS_Setup\SqlLocalDB.msi"
      ${ElseIf} $0 == 1602
        DetailPrint "LocalDB installation was cancelled by user"
        MessageBox MB_ICONEXCLAMATION "SQL Server LocalDB installation was cancelled. The application may not work correctly without it."
      ${ElseIf} $0 == 1603
        DetailPrint "LocalDB installation failed"
        MessageBox MB_ICONEXCLAMATION "SQL Server LocalDB installation failed. You may need to install it manually from Microsoft's website."
      ${Else}
        DetailPrint "LocalDB installation completed with code $0"
      ${EndIf}
    ${ElseIf} $0 == "Cancelled"
      DetailPrint "Download was cancelled by user"
      MessageBox MB_ICONINFORMATION "SQL Server LocalDB download was cancelled. You will need to install it manually for the application to work.$\n$\nDownload from: https://aka.ms/sqlexpress"
    ${Else}
      DetailPrint "Download failed: $0"
      MessageBox MB_ICONEXCLAMATION "Failed to download SQL Server LocalDB. Please check your internet connection.$\n$\nYou can install it manually from: https://aka.ms/sqlexpress"
    ${EndIf}
    
    ; Clean up temp directory
    RMDir "$TEMP\IMS_Setup"
  ${Else}
    DetailPrint "SQL Server LocalDB is already installed at: $1"
  ${EndIf}
  
  ; Wait a moment for LocalDB service to be ready
  Sleep 2000
  
  ; Create LocalDB instance (check if it exists first)
  DetailPrint "Checking for IMS_Instance..."
  nsExec::ExecToStack '"SqlLocalDB.exe" info IMS_Instance'
  Pop $0
  
  ${If} $0 != 0
    DetailPrint "Creating SQL Server LocalDB instance IMS_Instance..."
    nsExec::ExecToLog '"SqlLocalDB.exe" create "IMS_Instance" -s'
    Pop $0
    ${If} $0 == 0
      DetailPrint "Instance created and started successfully"
    ${Else}
      DetailPrint "Instance creation returned code $0 (may already exist)"
    ${EndIf}
  ${Else}
    DetailPrint "IMS_Instance already exists"
    ; Make sure it's started
    DetailPrint "Starting IMS_Instance..."
    nsExec::ExecToLog '"SqlLocalDB.exe" start "IMS_Instance"'
  ${EndIf}
  
  DetailPrint "SQL Server setup complete. Database will be initialized on first run."
!macroend

!macro customUnInstall
  DetailPrint "Cleaning up SQL Server LocalDB instance..."
  
  ; Stop the instance
  nsExec::ExecToLog '"SqlLocalDB.exe" stop "IMS_Instance"'
  Pop $0
  
  ; Delete the instance
  nsExec::ExecToLog '"SqlLocalDB.exe" delete "IMS_Instance"'
  Pop $0
  
  DetailPrint "Cleanup complete"
!macroend
