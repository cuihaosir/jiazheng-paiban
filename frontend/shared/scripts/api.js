/**
 * API 层 - 可切换 LocalStorage 模式和 HTTP API 模式
 * 设置 API_MODE = 'local' 使用 LocalStorage（演示模式，无需后端）
 * 设置 API_MODE = 'api' 使用后端 API（生产模式）
 */
const API_MODE = 'local'; // 'local' | 'api'
const API_BASE = 'http://localhost:3000/api';

const Api = {
  _token: null,

  /** 获取 Token */
  getToken() {
    if (this._token) return this._token;
    this._token = localStorage.getItem('jz_token');
    return this._token;
  },

  /** 保存 Token */
  setToken(token) {
    this._token = token;
    localStorage.setItem('jz_token', token);
  },

  /** 清除 Token */
  clearToken() {
    this._token = null;
    localStorage.removeItem('jz_token');
  },

  /** 发送 HTTP 请求 */
  async request(method, path, data) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    try {
      const options = { method, headers };
      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      let url = API_BASE + path;
      if (data && method === 'GET') {
        const params = new URLSearchParams(data).toString();
        if (params) url += '?' + params;
      }

      const resp = await fetch(url, options);
      const json = await resp.json();

      if (resp.status === 401) {
        this.clearToken();
        Utils.toast('登录过期，请重新登录');
        setTimeout(() => location.href = '../admin/index.html', 1000);
        return null;
      }

      if (json.code !== 0) {
        Utils.toast(json.message || '操作失败');
        return null;
      }

      return json.data;
    } catch (err) {
      console.error('API Error:', err);
      Utils.toast('网络错误，请检查后端服务');
      return null;
    }
  },

  /** GET */
  get(path, params) { return this.request('GET', path, params); },

  /** POST */
  post(path, data) { return this.request('POST', path, data); },

  /** PUT */
  put(path, data) { return this.request('PUT', path, data); },

  /** DELETE */
  del(path) { return this.request('DELETE', path); },

  /** 判断当前是否为本地模式 */
  isLocalMode() { return API_MODE === 'local'; }
};
