# Instrucciones para Activar el Host desde PowerShell

## Paso a Paso para Iniciar el Servidor de Desarrollo

### 1. Abrir PowerShell
   - Presiona `Windows + X` y selecciona "Windows PowerShell" o "Terminal"
   - O busca "PowerShell" en el menú de inicio

### 2. Navegar al Directorio del Proyecto
   ```powershell
   cd "C:\Users\carlo\Downloads\Leinn\Seagullfilms2 - copia"
   ```
   
   **Nota:** Asegúrate de estar en la carpeta correcta del proyecto.

### 3. Verificar que Node.js está Instalado
   ```powershell
   node --version
   ```
   
   Si no aparece una versión, necesitas instalar Node.js desde [nodejs.org](https://nodejs.org/)

### 4. Instalar Dependencias (Solo la Primera Vez)
   Si es la primera vez que ejecutas el proyecto, instala las dependencias:
   ```powershell
   npm install
   ```
   
   Este paso puede tardar unos minutos. Solo necesitas hacerlo una vez o cuando se agreguen nuevas dependencias.

### 5. Iniciar el Servidor de Desarrollo
   ```powershell
   npm run dev
   ```
   
   O si prefieres usar el comando completo:
   ```powershell
   npx vite
   ```

### 6. Acceder a la Aplicación
   Una vez que el servidor esté corriendo, verás un mensaje similar a:
   ```
   VITE v5.0.8  ready in 500 ms
   
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```
   
   - Abre tu navegador web
   - Navega a: `http://localhost:5173/`
   - ¡La aplicación debería estar funcionando!

### 7. Para Detener el Servidor
   - Presiona `Ctrl + C` en la terminal de PowerShell
   - Confirma presionando `Y` y luego Enter si se solicita

## Comandos Adicionales

### Ver Versión de npm
```powershell
npm --version
```

### Limpiar Cache (si hay problemas)
```powershell
npm cache clean --force
```

### Reinstalar Dependencias (si hay problemas)
```powershell
npm install --force
```

### Compilar para Producción
```powershell
npm run build
```

### Previsualizar Build de Producción
```powershell
npm run preview
```

## Solución de Problemas

### Error: "npm no se reconoce como comando"
   - Instala Node.js desde [nodejs.org](https://nodejs.org/)
   - Reinicia PowerShell después de la instalación

### Error: "Puerto 5173 ya está en uso"
   - Cierra otras instancias del servidor
   - O usa otro puerto: `npm run dev -- --port 3000`

### Error: "Módulos no encontrados"
   - Ejecuta: `npm install`
   - Asegúrate de estar en el directorio correcto del proyecto

### Error de Permisos
   - Ejecuta PowerShell como Administrador si es necesario
   - Verifica que tienes permisos de escritura en la carpeta del proyecto

## Acceso desde Otros Dispositivos en la Red Local

Para acceder desde otros dispositivos en tu red local:

1. Ejecuta el servidor con el flag `--host`:
   ```powershell
   npm run dev -- --host
   ```

2. Busca la dirección IP de tu máquina:
   ```powershell
   ipconfig
   ```
   
   Busca la dirección IPv4 (ejemplo: 192.168.1.100)

3. Accede desde otro dispositivo usando:
   `http://TU_IP:5173/`
   
   Ejemplo: `http://192.168.1.100:5173/`

## Usuarios de Prueba

Una vez que la aplicación esté corriendo, puedes iniciar sesión con:

- **Email:** admin@seagullfilms.com
- **Email:** maria@seagullfilms.com  
- **Email:** juan@seagullfilms.com

**Contraseña:** Cualquier contraseña funciona para estos usuarios de prueba.

---

**¡Listo!** Tu aplicación Seagull Films debería estar funcionando correctamente. 🎬








