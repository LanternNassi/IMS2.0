!include "LogicLib.nsh"

; -----------------------------
; Custom Install Actions (Client Mode)
; -----------------------------
!macro customInstall
  ; Prompt user for server IP using PowerShell InputBox
  nsExec::ExecToStack 'powershell -NoProfile -Command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.Interaction]::InputBox(''Enter the IMS Server IP or hostname:'', ''Server Configuration'', ''localhost'')"'
  Pop $0
  Pop $1

  ; Trim trailing whitespace, CR, LF
  trim_loop:
    StrCpy $2 $1 1 -1
    ${If} $2 == "$\r"
      StrLen $3 $1
      IntOp $3 $3 - 1
      StrCpy $1 $1 $3
      Goto trim_loop
    ${EndIf}
    ${If} $2 == "$\n"
      StrLen $3 $1
      IntOp $3 $3 - 1
      StrCpy $1 $1 $3
      Goto trim_loop
    ${EndIf}
    ${If} $2 == " "
      StrLen $3 $1
      IntOp $3 $3 - 1
      StrCpy $1 $1 $3
      Goto trim_loop
    ${EndIf}

  ; Set default if empty
  ${If} $1 == ""
    StrCpy $1 "localhost"
  ${EndIf}

  ; Test connection
  DetailPrint "Testing connection to http://$1:5184/api/Auth/verify ..."
  ; Write PowerShell script to temp file to avoid quote escaping issues
  GetTempFileName $5
  FileOpen $6 $5 w
  FileWrite $6 "try {$\r$\n"
  FileWrite $6 "  $$r = Invoke-WebRequest -Uri 'http://$1:5184/api/Auth/verify' -Method GET -TimeoutSec 10$\r$\n"
  FileWrite $6 "  if ($$r.StatusCode -eq 200 -or $$r.StatusCode -eq 401) { exit 0 } else { exit 1 }$\r$\n"
  FileWrite $6 "} catch { exit 2 }$\r$\n"
  FileClose $6
  nsExec::ExecToStack 'powershell -NoProfile -ExecutionPolicy Bypass -File "$5"'
  Pop $2
  Pop $3
  Delete $5
  
  ${If} $2 != 0
    MessageBox MB_YESNO|MB_ICONQUESTION \
      "Could not reach server at:$\n$1$\n$\nContinue installation anyway?" \
      IDYES continue_install
    Abort
  continue_install:
  ${Else}
    MessageBox MB_ICONINFORMATION "Server connection verified successfully at $1"
  ${EndIf}

  ; Create config file
  CreateDirectory "$APPDATA\IMS Desktop"
  FileOpen $4 "$APPDATA\IMS Desktop\server_config.ini" w
  ${If} $4 == ""
    MessageBox MB_ICONSTOP "Failed to create configuration file."
    Abort
  ${EndIf}
  FileWrite $4 "[Server]$\r$\n"
  FileWrite $4 "IP=$1$\r$\n"
  FileWrite $4 "BackendPort=5184$\r$\n"
  ; Note: FrontendPort is not needed - client serves frontend locally
  FileClose $4
!macroend

; -----------------------------
; Uninstall cleanup
; -----------------------------
!macro customUnInstall
  Delete "$APPDATA\IMS Desktop\server_config.ini"
  RMDir "$APPDATA\IMS Desktop"
!macroend

