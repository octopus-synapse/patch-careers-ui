export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.PrA0ANNj.js",app:"_app/immutable/entry/app.685EwPmJ.js",imports:["_app/immutable/entry/start.PrA0ANNj.js","_app/immutable/chunks/D3Iw2ZAM.js","_app/immutable/chunks/C0gvsygg.js","_app/immutable/chunks/-FHjlfxn.js","_app/immutable/entry/app.685EwPmJ.js","_app/immutable/chunks/BqCWK9tG.js","_app/immutable/chunks/C0gvsygg.js","_app/immutable/chunks/DF_bOkbo.js","_app/immutable/chunks/-FHjlfxn.js","_app/immutable/chunks/CBcoFzGA.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./server/nodes/0.js')),
			__memo(() => import('./server/nodes/1.js')),
			__memo(() => import('./server/nodes/2.js')),
			__memo(() => import('./server/nodes/3.js')),
			__memo(() => import('./server/nodes/4.js')),
			__memo(() => import('./server/nodes/5.js')),
			__memo(() => import('./server/nodes/6.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/onboarding",
				pattern: /^\/onboarding\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/signup",
				pattern: /^\/signup\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

export const prerendered = new Set([]);
