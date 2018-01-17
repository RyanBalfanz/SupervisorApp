const {app, Menu, Tray} = require('electron')
const menubar = require('menubar')
const Store = require('electron-store');

const APP_NAME = 'Supervior'
const APP_ICON = 'IconTemplate.png'
const GOLDEN_RATIO = (1.0 + Math.sqrt(5.0)) / 2.0
const USER_SETTINGS_STORE_NAME = 'user-settings'

const defaults = {
  showDockIcon: false,
  menubarWindowWidth: 850,
  supervisorUrl: 'http://localhost:9001',
}

const userSettingsStore = new Store({
  name: USER_SETTINGS_STORE_NAME,
  defaults: {
    showDockIcon: defaults.showDockIcon,
    supervisorUrl: defaults.supervisorUrl,
    windowBounds: {
      width: defaults.menubarWindowWidth,
      height: Math.round(defaults.menubarWindowWidth / GOLDEN_RATIO)
    },
  }
});

const menubarOptions = {
  icon: APP_ICON,
  index: userSettingsStore.get('supervisorUrl'),
  width: userSettingsStore.get('windowBounds')['width'],
  height: userSettingsStore.get('windowBounds')['height'],
  showDockIcon: userSettingsStore.get('showDockIcon'),
  tooltip: APP_NAME,
}

let mb = menubar(menubarOptions)

mb.on('ready', () => {
  mb.tray.on('right-click', () => {
    mb.tray.popUpContextMenu(get_right_click_menu())
  })
})

mb.on('after-hide', () => { mb.app.hide() } )

function get_right_click_menu() {
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
    template[1].submenu.push(
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
    template[3].submenu = [
      {role: 'close'},
      {role: 'minimize'},
      {role: 'zoom'},
      {type: 'separator'},
      {role: 'front'}
    ]
  }
  const menu = Menu.buildFromTemplate(template)
  return menu;
}
