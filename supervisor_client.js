const xmlrpc = require('xmlrpc')

const METHODS = {
  SYSTEM: {
    LIST_METHODS: 'system.listMethods',
    MULTICALL: 'system.multicall'
  },
  SUPERVISOR: {
    GET_ALL_PROCESS_INFO: 'supervisor.getAllProcessInfo',
    GET_STATE: 'supervisor.getState',
    RESTART: 'supervisor.restart',
    START_ALL_PROCESSES: 'supervisor.startAllProcesses',
    START_PROCESS: 'supervisor.startProcess',
    STOP_ALL_PROCESSES: 'supervisor.stopAllProcesses',
    STOP_PROCESS: 'supervisor.stopProcess'
  }
}

class SupervisorClient {
  constructor (config) {
    const defaultConfig = { host: 'localhost', port: 9001, path: '/RPC2' }
    this.client = xmlrpc.createClient(config || defaultConfig)
  }

  newMethodCallPromise (method, params = []) {
    return new Promise((resolve, reject) => {
      // console.info(method, params)
      this.client.methodCall(method, params, function (error, result) {
        if (error) {
          // console.error(error)
          return reject(error)
        }
        // console.log(result)
        resolve(result)
      })
    })
  }

  // Return an array listing the available method names
  // @return array result An array of method names available (strings)
  listAllMethods () {
    return this.newMethodCallPromise(METHODS.SYSTEM.LIST_METHODS)
  }

  // Return an array listing the available method names
  // @return array result An array of method names available (strings)
  methodHelp (name) {
    return this.newMethodCallPromise(METHODS.SYSTEM.METHOD_HELP, [name])
  }

  // Process an array of calls, and return an array of results.
  // Calls should be structs of the form {‘methodName’: string, ‘params’: array}.
  // Each result will either be a single-item array containing the result value, or a struct of the form {‘faultCode’: int, ‘faultString’: string}.
  // This is useful when you need to make lots of small calls without lots of round trips.
  // @param array calls An array of call requests
  // @return array result An array of results
  multicall (calls) {
    return this.newMethodCallPromise(METHODS.SYSTEM.MULTICALL, calls)
  }

  // Return current state of supervisord as a struct
  // @return struct A struct with keys int statecode, string statename
  getState () {
    return this.newMethodCallPromise(METHODS.SUPERVISOR.GET_STATE)
  }

  // Restart the supervisor process
  // @return boolean result always return True unless error
  restart () {
    return this.newMethodCallPromise(METHODS.SUPERVISOR.RESTART)
  }

  // Get info about all processes
  // @return array result An array of process status results
  getAllProcessInfo () {
    return this.newMethodCallPromise(METHODS.SUPERVISOR.GET_ALL_PROCESS_INFO)
  }

  // Start all processes listed in the configuration file
  // @return array result An array of process status info structs
  startAllProcesses (wait = true) {
    return this.newMethodCallPromise(METHODS.SUPERVISOR.START_ALL_PROCESSES, [wait])
  }

  // Start a process
  // @param string name Process name (or group:name, or group:*)
  // @param boolean wait Wait for process to be fully started
  // @return boolean result Always true unless error
  startProcess (name, wait = true) {
    return this.newMethodCallPromise(METHODS.SUPERVISOR.START_PROCESS, [name, wait])
  }

  // Stop all processes in the process list
  // @return boolean
  stopAllProcesses () {
    return this.newMethodCallPromise(METHODS.SUPERVISOR.STOP_ALL_PROCESSES)
  }

  // Stop a process named by name
  // @param string name The name of the process to stop (or ‘group:name’)
  // @param boolean wait Wait for the process to be fully stopped
  // @return boolean result Always return True unless error
  stopProcess (name, wait = true) {
    return this.newMethodCallPromise(METHODS.SUPERVISOR.STOP_PROCESS, [name, wait])
  }

  restartProcess (name, wait = true) {
    // TODO
    // return this.multicall([
    //   {
    //     'methodName': METHODS.SUPERVISOR.STOP_PROCESS,
    //     'params': [name]
    //   },
    //   {
    //     'methodName': METHODS.SUPERVISOR.START_PROCESS,
    //     'params': [name]
    //   }
    // ])
    return Promise.resolve()
      .then(() => { return this.stopProcess(name, wait) })
      .then(() => { return this.startProcess(name, wait) })
  }
}

module.exports = SupervisorClient
