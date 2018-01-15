const {app, Menu, Tray} = require('electron')
const menubar = require('menubar')

const APP_NAME = 'Supervior'
const GOLDEN_RATIO = 1.6180339887498948482
const MENUBAR_WINDOW_WIDTH = 850
const MENUBAR_WINDOW_HEIGHT= Math.round(MENUBAR_WINDOW_WIDTH/GOLDEN_RATIO)
const SUPERVISOR_URL = 'http://localhost:9001'

const menubarOptions = {
  icon: 'IconTemplate.png',
  index: SUPERVISOR_URL,
  width: MENUBAR_WINDOW_WIDTH,
  height: MENUBAR_WINDOW_HEIGHT,
  // preloadWindow: false,
  showDockIcon: true,
  // showOnRightClick: false,
  tooltip: APP_NAME
}

let mb = menubar(menubarOptions)

mb.on('ready', () => {
  show_motd()
  mb.tray.on('right-click', () => {
    console.log('try right-clicked')
    mb.tray.popUpContextMenu(get_right_click_menu())
  })
})
mb.on('after-create-window', () => { console.log('after-window-create') })
mb.on('after-hide', () => { console.log('after-hide'); mb.app.hide() } )

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
function show_motd() { console.log(`${APP_NAME} is ready…`) }
function hide_menubar_app() { mb.app.hide() }
