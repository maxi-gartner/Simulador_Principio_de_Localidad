// Configuración inicial
const accessTimes = {
  registers: 1,
  cacheL1: 3,
  cacheL2: 10,
  ram: 100,
  disk: 10000000,
}

let stats = {
  totalAccesses: 0,
  registerHits: 0,
  l1Hits: 0,
  l2Hits: 0,
  ramHits: 0,
  diskAccesses: 0,
  totalAccessTime: 0,
}

let memoryState = {
  registers: Array(4).fill(null),
  cacheL1: Array(6).fill(null),
  cacheL2: Array(8).fill(null),
  ram: Array.from({ length: 10 }, (_, i) => ({
    start: i * 10,
    end: i * 10 + 9,
    data: Array(10).fill(0),
  })),
  disk: Array.from({ length: 10 }, (_, i) => ({
    start: i * 100,
    end: i * 100 + 99,
  })),
}

// Función para simular un acceso a memoria
function simulateAccess(address) {
  stats.totalAccesses++
  let accessTime = 0
  let found = false
  let log = `Acceso a dirección ${address}: `

  // Comprobar registros
  const regIndex = memoryState.registers.indexOf(address)
  if (regIndex !== -1) {
    highlightBlock(`reg-${regIndex + 1}`)
    stats.registerHits++
    accessTime = accessTimes.registers
    log += `HIT en Registros (${accessTime} ns)`
    found = true
  }

  // Comprobar Caché L1
  else if (!found) {
    const l1Block = memoryState.cacheL1.findIndex(
      (block) =>
        block !== null && address >= block.start && address <= block.end
    )

    if (l1Block !== -1) {
      highlightBlock(`l1-${l1Block + 1}`)
      stats.l1Hits++
      accessTime = accessTimes.cacheL1
      log += `HIT en Caché L1 (${accessTime} ns)`
      found = true

      // Traer a registros
      updateRegisters(address)
    }
  }

  // Comprobar Caché L2
  if (!found) {
    const l2Block = memoryState.cacheL2.findIndex(
      (block) =>
        block !== null && address >= block.start && address <= block.end
    )

    if (l2Block !== -1) {
      highlightBlock(`l2-${l2Block + 1}`)
      stats.l2Hits++
      accessTime = accessTimes.cacheL2
      log += `HIT en Caché L2 (${accessTime} ns)`
      found = true

      // Traer a Caché L1 y registros
      updateCacheL1(memoryState.cacheL2[l2Block])
      updateRegisters(address)
    }
  }

  // Comprobar RAM
  if (!found) {
    const ramBlock = memoryState.ram.findIndex(
      (block) => address >= block.start && address <= block.end
    )

    if (ramBlock !== -1) {
      highlightBlock(`ram-${ramBlock + 1}`)
      stats.ramHits++
      accessTime = accessTimes.ram
      log += `HIT en RAM (${accessTime} ns)`
      found = true

      // Traer a Caché L2, Caché L1 y registros
      const blockData = {
        start: Math.floor(address / 10) * 10,
        end: Math.floor(address / 10) * 10 + 9,
        data: memoryState.ram[ramBlock].data,
      }
      updateCacheL2(blockData)
      updateCacheL1(blockData)
      updateRegisters(address)
    }
  }

  // Acceder al disco
  if (!found) {
    const diskBlock = Math.floor(address / 100)
    highlightBlock(`disk-${diskBlock + 1}`)
    stats.diskAccesses++
    accessTime = accessTimes.disk
    log += `MISS - Acceso a DISCO (${accessTime} ns)`

    // Traer a RAM, Caché L2, Caché L1 y registros
    const blockData = {
      start: Math.floor(address / 10) * 10,
      end: Math.floor(address / 10) * 10 + 9,
      data: Array(10)
        .fill(0)
        .map((_, i) => Math.floor(Math.random() * 100)),
    }
    updateRAM(blockData)
    updateCacheL2(blockData)
    updateCacheL1(blockData)
    updateRegisters(address)
  }

  stats.totalAccessTime += accessTime
  updateStats()
  logAccess(log)

  return accessTime
}

// Funciones para actualizar cada nivel de memoria
function updateRegisters(address) {
  const emptySlot = memoryState.registers.indexOf(null)
  if (emptySlot !== -1) {
    memoryState.registers[emptySlot] = address
  } else {
    // Política de reemplazo simple: reemplazar el primer registro
    memoryState.registers.shift()
    memoryState.registers.push(address)
  }
  updateMemoryDisplay()
}

function updateCacheL1(block) {
  const emptySlot = memoryState.cacheL1.indexOf(null)
  if (emptySlot !== -1) {
    memoryState.cacheL1[emptySlot] = block
  } else {
    // Política de reemplazo simple: FIFO
    memoryState.cacheL1.shift()
    memoryState.cacheL1.push(block)
  }
  updateMemoryDisplay()
}

function updateCacheL2(block) {
  const emptySlot = memoryState.cacheL2.indexOf(null)
  if (emptySlot !== -1) {
    memoryState.cacheL2[emptySlot] = block
  } else {
    // Política de reemplazo simple: FIFO
    memoryState.cacheL2.shift()
    memoryState.cacheL2.push(block)
  }
  updateMemoryDisplay()
}

function updateRAM(block) {
  const ramIndex = Math.floor(block.start / 10)
  if (ramIndex < memoryState.ram.length) {
    memoryState.ram[ramIndex] = block
  }
  updateMemoryDisplay()
}

// Actualizar la visualización de la memoria
function updateMemoryDisplay() {
  // Actualizar registros
  memoryState.registers.forEach((addr, i) => {
    document.getElementById(`reg-${i + 1}`).textContent = `R${i + 1}: ${
      addr !== null ? addr : "Vacío"
    }`
  })

  // Actualizar Caché L1
  memoryState.cacheL1.forEach((block, i) => {
    document.getElementById(`l1-${i + 1}`).textContent =
      block !== null
        ? `Dir ${block.start}-${block.end}`
        : `Bloque ${i + 1}: Vacío`
  })

  // Actualizar Caché L2
  memoryState.cacheL2.forEach((block, i) => {
    document.getElementById(`l2-${i + 1}`).textContent =
      block !== null
        ? `Dir ${block.start}-${block.end}`
        : `Bloque ${i + 1}: Vacío`
  })
}

// Resaltar un bloque de memoria
function highlightBlock(id) {
  // Eliminar resaltado anterior
  document.querySelectorAll(".memory-block").forEach((block) => {
    block.classList.remove("active")
  })

  // Aplicar nuevo resaltado
  const block = document.getElementById(id)
  if (block) {
    block.classList.add("active")
    setTimeout(() => {
      block.classList.remove("active")
    }, 500)
  }
}

// Actualizar estadísticas
function updateStats() {
  document.getElementById("total-accesses").textContent = stats.totalAccesses
  document.getElementById("register-hit-ratio").textContent =
    stats.totalAccesses > 0
      ? `${((stats.registerHits / stats.totalAccesses) * 100).toFixed(2)}%`
      : "0%"
  document.getElementById("l1-hit-ratio").textContent =
    stats.totalAccesses > 0
      ? `${((stats.l1Hits / stats.totalAccesses) * 100).toFixed(2)}%`
      : "0%"
  document.getElementById("l2-hit-ratio").textContent =
    stats.totalAccesses > 0
      ? `${((stats.l2Hits / stats.totalAccesses) * 100).toFixed(2)}%`
      : "0%"
  document.getElementById("ram-hit-ratio").textContent =
    stats.totalAccesses > 0
      ? `${((stats.ramHits / stats.totalAccesses) * 100).toFixed(2)}%`
      : "0%"
  document.getElementById("disk-accesses").textContent = stats.diskAccesses
  document.getElementById("avg-access-time").textContent =
    stats.totalAccesses > 0
      ? (stats.totalAccessTime / stats.totalAccesses).toFixed(2)
      : "0"
}

// Registrar acceso en el log
function logAccess(message) {
  const log = document.getElementById("access-log")
  log.innerHTML += `<div>${message}</div>`
  log.scrollTop = log.scrollHeight
}

// Reiniciar la simulación
function resetSimulation() {
  stats = {
    totalAccesses: 0,
    registerHits: 0,
    l1Hits: 0,
    l2Hits: 0,
    ramHits: 0,
    diskAccesses: 0,
    totalAccessTime: 0,
  }

  memoryState = {
    registers: Array(4).fill(null),
    cacheL1: Array(6).fill(null),
    cacheL2: Array(8).fill(null),
    ram: Array.from({ length: 10 }, (_, i) => ({
      start: i * 10,
      end: i * 10 + 9,
      data: Array(10).fill(0),
    })),
    disk: Array.from({ length: 10 }, (_, i) => ({
      start: i * 100,
      end: i * 100 + 99,
    })),
  }

  updateMemoryDisplay()
  updateStats()
  document.getElementById("access-log").innerHTML = ""
}

// Simulación de patrones de acceso
function simulateHighLocality() {
  // Alta localidad: accesos muy cercanos
  const baseAddress = Math.floor(Math.random() * 20)

  for (let i = 0; i < 20; i++) {
    const address =
      baseAddress + (Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0)
    setTimeout(() => {
      simulateAccess(address)
    }, i * 300)
  }
}

function simulateMediumLocality() {
  // Localidad media: accesos en una región más amplia
  const baseAddress = Math.floor(Math.random() * 50)

  for (let i = 0; i < 20; i++) {
    const address = baseAddress + Math.floor(Math.random() * 15)
    setTimeout(() => {
      simulateAccess(address)
    }, i * 300)
  }
}

function simulateLowLocality() {
  // Baja localidad: accesos dispersos
  for (let i = 0; i < 20; i++) {
    const address = Math.floor(Math.random() * 100)
    setTimeout(() => {
      simulateAccess(address)
    }, i * 300)
  }
}

function simulateDiskIntensive() {
  // Acceso intensivo a disco: accesos a direcciones lejanas
  for (let i = 0; i < 20; i++) {
    const address = Math.floor(Math.random() * 1000)
    setTimeout(() => {
      simulateAccess(address)
    }, i * 300)
  }
}

// Configurar event listeners
document
  .getElementById("simulate-high")
  .addEventListener("click", simulateHighLocality)
document
  .getElementById("simulate-medium")
  .addEventListener("click", simulateMediumLocality)
document
  .getElementById("simulate-low")
  .addEventListener("click", simulateLowLocality)
document
  .getElementById("simulate-disk")
  .addEventListener("click", simulateDiskIntensive)
document.getElementById("reset").addEventListener("click", resetSimulation)

// Inicializar la simulación
resetSimulation()
