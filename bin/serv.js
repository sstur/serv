#!/usr/bin/env node

var serv, opts, argv;

serv = require('../serv');

opts = require('optimist')
	.options('h', {
		alias: 'help',
		boolean: true,
		description: 'Show this help message'
	})
	.options('b', {
		alias: 'bind',
		default: '127.0.0.1',
		description: 'IP to bind the server to'
	})
	.options('p', {
		alias: 'port',
		default: process.env.PORT || 'Auto (8000+)',
		description: 'Port to bind the server to, uses PORT env var if set'
	})
	.options('path', {
		default: process.cwd(),
		description: 'File system path to expose'
	})
	.options('proxy', {
		description: 'When a resource is not found, proxy the request to another server'
	})
	.options('public', {
		boolean: true,
		description: 'Listen on all available IP addresses'
	});
argv = opts.argv;

if (argv.help) {
	opts.showHelp(console.log);
	return;
}

argv.path = argv._[0] || argv.path;

serv(argv);
