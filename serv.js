var http, open, path, express, keypress, httpProxy, spawnArgs, childProcess;

http = require('http');
open = require('open');
path = require('path');
express = require('express');
keypress = require('keypress');
httpProxy = require('http-proxy');
spawnArgs = require('spawn-args');
childProcess = require('child_process');

module.exports = function serv(opts) {
	var mount, host, port, app, isUserSpecifiedPort, proxy;

	mount = path.resolve(opts.path);
	host = opts.public ? '0.0.0.0' : opts.bind;
	isUserSpecifiedPort = (typeof opts.port === 'number');
	port = isUserSpecifiedPort ? opts.port : 8000;

  proxy = opts.proxy ? httpProxy.createProxyServer() : null;

	app = express.createServer();
	app.configure(function() {
		app.use(express.static(mount));
		app.use(express.directory(mount));
    if (opts.proxy) {
      app.use(function(req, res) {
        proxy.web(req, res, { target: opts.proxy });
      });
    }
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

	app.on('listening', function() {
		var url;
		if (host === '127.0.0.1' || host === '0.0.0.0') {
			url = 'http://localhost:' + port
		} else {
			url = 'http://' + host + ':' + port
		}
		console.log('Serving files from ' + mount + ' at ' + url);
		console.log('Press Ctrl+L to launch in browser');
		console.log('Press Ctrl+C to quit');

		keypress(process.stdin);

		process.stdin.on('keypress', function(ch, key) {
			if (!key) {
				return;
			}
			if (key.ctrl && key.name === 'c') {
				process.exit();
			}
			if (key.ctrl && key.name === 'l') {
				console.log('Launching ' + url + '/');
				open(url + '/');
			}
		});

		process.stdin.setRawMode(true);
		process.stdin.resume();

    if (opts.spawn) {
      spawnChild(opts.spawn);
    }
	});

	app.on('error', function(error) {
		if (error.code === 'EADDRINUSE' && !isUserSpecifiedPort) {
			port += 1;
			app.listen(port, host);
		} else {
			throw error;
		}
	});

	app.listen(port, host);


  function spawnChild(command) {
    var parts, child;
    parts = spawnArgs(command);
    child = childProcess.spawn(parts[0], parts.slice(1));
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
      process.stdout.write(prependLines(data, 'CHILD: '));
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(data) {
      process.stderr.write(prependLines(data, 'CHILD: '));
    });
    process.on('exit', function() {
      console.log('Killing child process ' + child.pid);
      child.kill();
    });
    return child;
  }

  function prependLines(data, prefix) {
    var lines = data.split(/\r\n|\r|\n/);
    if (lines.slice(-1)[0] === '') {
      lines.pop();
    }
    return lines.map(function(line) {
      return prefix + line;
    }).join('\n') + '\n';
  }

};
