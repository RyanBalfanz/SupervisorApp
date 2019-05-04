console.time('ready')
const {app, clipboard, Menu} = require('electron')
const AutoLaunch = require('auto-launch')
const menubar = require('menubar')
const Store = require('electron-store')
const unhandled = require('electron-unhandled')

const SupervisorClient = require('./supervisor_client')

const APP_NAME = 'Supervisor'
const APP_ICON = 'IconTemplate.png'
const APP_PATH = `/Applications/${APP_NAME}.app`
const GOLDEN_RATIO = (1.0 + Math.sqrt(5.0)) / 2.0
const USER_SETTINGS_STORE_NAME = 'user-settings'

const reloadIndexOnShow = true
const defaults = {
  showDockIcon: false,
  menubarWindowWidth: 850,
  supervisorUrl: 'http://localhost:9001',
  autoLaunchEnabled: true,
  autoLaunch: {
    isEnabled: true,
    options: {
      isHidden: true
    }
  }
}

const LOADING_PAGE_TEMPLATE_CSS = `
.loader {
  border: 16px solid #f3f3f3; /* Light grey */
  border-top: 16px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite;
}
#grad {
background: RGB(203, 203, 203);
}
`
const LOADING_PAGE_TEMPLATE = `<html><head><style>${LOADING_PAGE_TEMPLATE_CSS}</style></head><body id='grad'></body></html>`

const autoLauncher = new AutoLaunch({ name: APP_NAME, path: APP_PATH })

const userSettingsStore = new Store({
  name: USER_SETTINGS_STORE_NAME,
  defaults: {
    autoLaunch: defaults.autoLaunch,
    showDockIcon: defaults.showDockIcon,
    supervisorUrl: defaults.supervisorUrl,
    windowBounds: {
      width: defaults.menubarWindowWidth,
      height: Math.round(defaults.menubarWindowWidth / GOLDEN_RATIO)
    }
  }
})

unhandled()

// Enable or disable auto-launching if incorrectly set.
autoLauncher.isEnabled(defaults.autoLaunch.options)
.then(function (isEnabled) {
  if (isEnabled) {
    console.info('Auto-launching is enabled')
    if (!userSettingsStore.get('autoLaunch.isEnabled')) {
      console.info('Disabling auto-launch')
      autoLauncher.disable()
    }
  } else {
    console.info('Auto-launching is not enabled')
    if (userSettingsStore.get('autoLaunch.isEnabled')) {
      console.info('Enabling auto-launch')
      autoLauncher.enable()
    }
  }
})
.catch(function (err) {
  console.error(err)
})

const menubarOptions = {
  icon: APP_ICON,
  index: reloadIndexOnShow ? `data:text/html,${LOADING_PAGE_TEMPLATE}` : userSettingsStore.get('supervisorUrl'),
  width: userSettingsStore.get('windowBounds')['width'],
  height: userSettingsStore.get('windowBounds')['height'],
  preloadWindow: true,
  showDockIcon: userSettingsStore.get('showDockIcon'),
  tooltip: APP_NAME
}

let mb = menubar(menubarOptions)
let supervisor

let supervisorState = ''
let procs = []

mb.on('ready', () => {
  const supervisorConfig = { host: 'localhost', port: 9001, path: '/RPC2' }
  supervisor = new SupervisorClient(supervisorConfig)
  init()
  const initInterval = setInterval(() => { init() }, 5000)
  // clearInterval(initInterval)

  mb.tray.on('right-click', (event) => {
    init()
    let menu = getRightClickMenu()
    // let menu = getRightClickMenuSupervisorOnly()
    mb.tray.popUpContextMenu(menu)
    menu = getRightClickMenu()
  })
  console.timeEnd('ready')
})

mb.on('create-window', () => {
  console.log('create-window')
  const HTML = LOADING_PAGE_TEMPLATE
  console.log(HTML)
  // mb.window.loadURL(`data:text/html,${LOADING_PAGE_TEMPLATE}`)
})

mb.on('show', () => {
  console.log('show')
  if (reloadIndexOnShow) {
    mb.window.loadURL(userSettingsStore.get('supervisorUrl'))
  }
})

mb.on('after-hide', () => {
  console.log('after-hide')
  mb.app.hide()
  if (reloadIndexOnShow) {
    const HTML = LOADING_PAGE_TEMPLATE
    console.log(HTML)
    mb.window.loadURL(`data:text/html,${LOADING_PAGE_TEMPLATE}`)
  }
})

function init () {
  supervisor.getState()
    .then((result) => { supervisorState = result })
  supervisor.listAllMethods()
  supervisor.getAllProcessInfo()
    .then((result) => { procs = result })
}

function getSupervisorMenuItemTemplate() {
  const template = {
    label: 'Programs and Groups',
    submenu: [
      {
        label: `Supervisor status: ${supervisor.getState()}`,
        enabled: false
      },
      { type: 'separator' },
      { label: 'Start Supervisor', enabled: false, click: () => { supervisor.start() } },
      { label: 'Stop Supervisor', enabled: false, click: () => { supervisor.stop() } },
      { label: 'Restart Supervisor', enabled: true, click: () => { supervisor.restart() } },
      { type: 'separator' },
      {
        label: 'All',
        submenu: [
          { label: 'Start All', click: () => { supervisor.startAllProcesses() } },
          { label: 'Stop All', click: () => { supervisor.stopAllProcesses() } },
          { label: 'Restart All', click: () => { supervisor.restartAllProcesses() } }
        ]
      },
      { type: 'separator' }
    ].concat(procs.map((value, index) => {
      return {
        click: (menuItem, browserWindow, event) => { console.log(menuItem, browserWindow, event) },
        label: value.name,
        submenu: [
          { label: 'Start', enabled: [0].includes(value.state), click: () => { supervisor.startProcess(value.name) } },
          { label: 'Stop', enabled: [20].includes(value.state), click: () => { supervisor.stopProcess(value.name) } },
          { label: 'Restart', enabled: [20].includes(value.state), click: () => { supervisor.restartProcess(value.name) } },
          { type: 'separator' },
          { label: 'Logs', submenu: [
            { label: `${value.stdout_logfile}`, click: () => { clipboard.writeText(value.stdout_logfile) } },
            { label: `${value.stderr_logfile}`, click: () => { clipboard.writeText(value.stderr_logfile) } }
          ] },
          { type: 'separator' },
          { label: `State: ${value.statename}`, enabled: false },
          { label: `${value.description}`, enabled: false }
        ]
      }
    }))
  }
  return template
}

function getRightClickMenuTemplate() {
  const template = [
    {
      label: 'Edit',
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'pasteandmatchstyle'},
        {role: 'delete'},
        {role: 'selectall'}
      ]
    },
    {
      label: 'View',
      submenu: [
        {role: 'reload'},
        {role: 'forcereload'},
        {role: 'toggledevtools'},
        {type: 'separator'},
        {role: 'resetzoom'},
        {role: 'zoomin'},
        {role: 'zoomout'},
        {type: 'separator'},
        {role: 'togglefullscreen'}
      ]
    },
    {
      role: 'window',
      submenu: [
        {role: 'minimize'},
        {role: 'close'}
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () { require('electron').shell.openExternal('https://electronjs.org') }
        }
      ]
    }
  ]

  template.unshift(getSupervisorMenuItemTemplate());

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {role: 'about'},
        {type: 'separator'},
        {role: 'services', submenu: []},
        {type: 'separator'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
        {type: 'separator'},
        {role: 'quit'}
      ]
    })

    // Edit menu
    template[2].submenu.push(
      {type: 'separator'},
      {
        label: 'Speech',
        submenu: [
          {role: 'startspeaking'},
          {role: 'stopspeaking'}
        ]
      }
    )

    // Window menu
    template[4].submenu = [
      {role: 'close'},
      {role: 'minimize'},
      {role: 'zoom'},
      {type: 'separator'},
      {role: 'front'}
    ]
  }
  return template
}

function getRightClickMenuSupervisorOnly() {
  const template = getSupervisorMenuItemTemplate().submenu
  const menu = Menu.buildFromTemplate(template)
  return menu
}

function getRightClickMenu () {
  const template = getRightClickMenuTemplate()
  const menu = Menu.buildFromTemplate(template)
  return menu
}
