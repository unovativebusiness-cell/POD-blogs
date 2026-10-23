/**
 * Local convenience entry. On Plesk, use app.cjs as the startup file.
 * (Passenger require() breaks ESM app.js when package.json has "type": "module".)
 */
import './app.cjs';
