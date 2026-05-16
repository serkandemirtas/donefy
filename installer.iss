; installer.iss
; -------------
; Inno Setup script for DONEFY.
; This creates a professional Windows installer (.exe) with:
;   - Install wizard with license screen
;   - Desktop shortcut
;   - Start Menu entry
;   - Uninstaller
;
; HOW TO USE:
;   1. First run build-exe.bat to create the EXE folder
;   2. Install Inno Setup from: https://jrsoftware.org/isdl.php
;   3. Double-click this file in Inno Setup, click Compile
;   4. Output: installer\DONEFYSetup.exe

#define MyAppName      "DONEFY"
#define MyAppVersion   "1.0.0"
#define MyAppPublisher "DONEFY"
#define MyAppURL       "https://github.com/your-username/donefy"
#define MyAppExeName   "DONEFY.exe"
#define MyAppID        "{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}"

; Source folder — PyInstaller output
#define BuildDir "backend\dist\DONEFY"

[Setup]
; Unique app ID (do not change after first release)
AppId={#MyAppID}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Default install location: C:\Program Files\DONEFY
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}

; Output: installer folder next to this script
OutputDir=installer
OutputBaseFilename=DONEFYSetup
SetupIconFile=frontend\public\logo.png

; Compression settings
Compression=lzma2/ultra64
SolidCompression=yes
InternalCompressLevel=ultra64

; Appearance
WizardStyle=modern
WizardSizePercent=120

; Require admin for Program Files install
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

; Minimum Windows version: Windows 10
MinVersion=10.0

; Allow upgrade installs without prompting uninstall first
CloseApplications=force

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
; Optional checkboxes shown in the installer
Name: "desktopicon";    Description: "Create a &desktop shortcut";    GroupDescription: "Additional icons:"; Flags: checked
Name: "quicklaunchicon"; Description: "Create a &Quick Launch shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked; OnlyBelowVersion: 6.1

[Files]
; Copy the entire PyInstaller output folder
Source: "{#BuildDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; Copy logo for Start Menu / desktop icon display
Source: "frontend\public\logo.png"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Start Menu shortcut
Name: "{group}\{#MyAppName}";                    Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\Uninstall {#MyAppName}";          Filename: "{uninstallexe}"

; Desktop shortcut (only if user checked the box)
Name: "{autodesktop}\{#MyAppName}";              Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: quicklaunchicon

[Run]
; Ask user if they want to launch DONEFY after installing
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Clean up data files created at runtime
Type: filesandordirs; Name: "{app}\uploads"
Type: files;          Name: "{app}\todos.db"
Type: files;          Name: "{app}\settings.json"
