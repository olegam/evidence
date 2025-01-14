import { beforeEach, describe, it, expect } from 'vitest';
import child_process from 'child_process';
import fs from 'fs/promises';

const allowedTimeout = process.env.GITHUB_ACTIONS ? 1000 * 30 /* 30 seconds */ : 15000;
const goalStartupTime = (allowedTimeout * 1) / 3;
const goalFirstRequestTime = (allowedTimeout * 2) / 3;

if (process.env.GITHUB_ACTIONS) {
	console.log('Running on GitHub Actions');
}

// beforeEach(async () => {
// 	await fs.rm('.evidence', { recursive: true, force: true });
// 	await new Promise((r) => setTimeout(r, 1000));
// });

it('Should be timed appropriately', { timeout: allowedTimeout * 10 }, async () => {
	const devServerProcess = child_process.spawn('npm', ['run', 'dev'], {
		stdio: 'pipe',
		shell: true,
		env: {
			...process.env,
			FORCE_COLOR: ''
		}
	});
	const procStartTime = performance.now()

	const exitCode = await new Promise((resolve, reject) => {
		let running = false;
		devServerProcess.on('exit', resolve);
		devServerProcess.on('error', reject);
		devServerProcess.stderr.on('data', (data) => {
			console.error(data.toString());
		})

		devServerProcess.stdout.on('data', async (data) => {
			let message = data.toString();
			if (running) return; // ignore everything once we have confirmed server start
			console.log(message);
			// remove any colors from message
			// @eslint-disable-next-line
			const colorRegex = /\x1b\[[0-9;]*m/g;
			message = message.replace(colorRegex, '');

			const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in ([\d]+) ms/g;
			const result = regex.exec(message);
			if (!result) {
				return;
			}
			try {
				const startupTime = parseInt(result[1]);
				expect(startupTime, "Dev server startup time").toBeLessThan(goalStartupTime);
			} catch (e) {
				reject(e);
				return;
			}
			running = true


			const beforeBody = performance.now()
			const body = await (await fetch("http://localhost:3000")).text();
			const afterBody = performance.now()
			try {
				const firstRequestTime = afterBody - beforeBody
				expect(firstRequestTime, "First request time").toBeLessThan(goalFirstRequestTime);
				expect(afterBody - procStartTime, "Total startup time").toBeLessThan(allowedTimeout);
			} catch (e) {
				reject(e);
			} finally {
				devServerProcess.kill();
			}
		});
	});
	expect([0, null]).toContain(exitCode);
});

// describe('Dev Server Startup', () => {
// 	it('Should start the dev server', { timeout: allowedTimeout }, async () => {
// 		const proc = child_process.spawn('npm', ['run', 'dev'], {
// 			stdio: 'pipe',
// 			shell: true,
// 			env: {
// 				...process.env,
// 				FORCE_COLOR: ''
// 			}
// 		});

// 		console.log('Starting dev server');

// 		const done = new Promise((resolve, reject) => {
// 			const cleanup = () => {
// 				proc.off('close', resolve);
// 				proc.off('exit', resolve);
// 				proc.stdout.off('data', onStdoutData);
// 				proc.off('error', onError);
// 				proc.kill();
// 			};

// 			const onStdoutData = (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				// @eslint-disable-next-line
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');

// 				console.log(message);

// 				const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in ([\d]+) ms/g;
// 				const result = regex.exec(message);
// 				if (result) {
// 					const startupTime = parseInt(result[1]);
// 					proc.kill();
// 					try {
// 						expect(startupTime).toBeLessThan(goalStartupTime);
// 						resolve();
// 					} catch (e) {
// 						reject(e);
// 					} finally {
// 						cleanup();
// 					}
// 					console.log('End state reached');
// 				}
// 			};
// 			const onStderrData = (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');
// 				if (message.includes('error while starting dev server')) {
// 					cleanup();
// 					reject(new Error(message));
// 					return;
// 				}

// 				console.error(message);
// 			};
// 			const onError = (err) => {
// 				console.error(err);
// 				cleanup();
// 				reject(err);
// 			};

// 			proc.on('close', resolve);
// 			proc.on('exit', resolve);
// 			proc.on('error', onError);
// 			proc.stdout.on('data', onStdoutData);
// 			proc.stderr.on('data', onStderrData);
// 		});

// 		const exitCode = await done;
// 		if (typeof exitCode === 'number') {
// 			expect(exitCode).toBe(0);
// 		}

// 		// dev server should start within 5 seconds
// 	});
// 	it('Should start the dev server again', { timeout: allowedTimeout }, async () => {
// 		const proc = child_process.spawn('npm', ['run', 'dev'], {
// 			stdio: 'pipe',
// 			shell: true,
// 			env: {
// 				...process.env,
// 				FORCE_COLOR: ''
// 			}
// 		});

// 		console.log('Starting dev server');

// 		const done = new Promise((resolve, reject) => {
// 			const cleanup = () => {
// 				proc.off('close', resolve);
// 				proc.off('exit', resolve);
// 				proc.stdout.off('data', onStdoutData);
// 				proc.off('error', onError);
// 			};

// 			const onStdoutData = (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				// @eslint-disable-next-line
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');

// 				console.log(message);

// 				const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in ([\d]+) ms/g;
// 				const result = regex.exec(message);
// 				if (result) {
// 					const startupTime = parseInt(result[1]);
// 					proc.kill();
// 					try {
// 						expect(startupTime).toBeLessThan(goalStartupTime);
// 						resolve();
// 					} catch (e) {
// 						reject(e);
// 					} finally {
// 						cleanup();
// 					}
// 					console.log('End state reached');
// 				}
// 			};
// 			const onStderrData = (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');
// 				if (message.includes('error while starting dev server')) {
// 					cleanup();
// 					reject(new Error(message));
// 					return;
// 				}

// 				console.error(message);
// 			};
// 			const onError = (err) => {
// 				console.error(err);
// 				cleanup();
// 				reject(err);
// 			};

// 			proc.on('close', resolve);
// 			proc.on('exit', resolve);
// 			proc.on('error', onError);
// 			proc.stdout.on('data', onStdoutData);
// 			proc.stderr.on('data', onStderrData);
// 		});

// 		const exitCode = await done;
// 		if (typeof exitCode === 'number') {
// 			expect(exitCode).toBe(0);
// 		}
// 		// dev server should start within 5 seconds
// 	});
// 	it('Should have a reasonable response time on the first request', { timeout: allowedTimeout }, async () => {
// 		const proc = child_process.spawn('npm', ['run', 'dev'], {
// 			stdio: 'pipe',
// 			shell: true,
// 			env: {
// 				...process.env,
// 				FORCE_COLOR: ''
// 			}
// 		});

// 		console.log('Starting dev server');

// 		const done = new Promise((resolve, reject) => {
// 			const cleanup = () => {
// 				proc.off('close', resolve);
// 				proc.off('exit', resolve);
// 				proc.stdout.off('data', onStdoutData);
// 				proc.off('error', onError);
// 			};

// 			const onStdoutData = async (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				// @eslint-disable-next-line
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');

// 				console.log(message);

// 				const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in ([\d]+) ms/g;
// 				const result = regex.exec(message);
// 				if (result) {
// 					const before = performance.now();
// 					const res = await fetch("http://localhost:3000/").then(r => r.text());
// 					const after = performance.now();
// 					console.log(`Took ${after - before} ms`);
// 					console.log(res)
// 					try {
// 						expect(after - before).toBeLessThan(1000);
// 						resolve();
// 					} catch (e) {
// 						reject(e);
// 					} finally {
// 						proc.kill();
// 						cleanup();
// 					}

// 					console.log('End state reached');
// 				}
// 			};
// 			const onStderrData = (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');
// 				if (message.includes('error while starting dev server')) {
// 					cleanup();
// 					reject(new Error(message));
// 					return;
// 				}

// 				console.error(message);
// 			};
// 			const onError = (err) => {
// 				console.error(err);
// 				cleanup();
// 				reject(err);
// 			};

// 			proc.on('close', resolve);
// 			proc.on('exit', resolve);
// 			proc.on('error', onError);
// 			proc.stdout.on('data', onStdoutData);
// 			proc.stderr.on('data', onStderrData);
// 		});

// 		const exitCode = await done;
// 		if (typeof exitCode === 'number') {
// 			expect(exitCode).toBe(0);
// 		}
// 		// dev server should start within 5 seconds
// 	});

// 	// it(
// 	// 	'Should have a reasonable response time on the first request',
// 	// 	{ timeout: allowedTimeout },
// 	// 	async () => {
// 	// 		const proc = child_process.spawn('npm', ['run', 'dev'], {
// 	// 			stdio: 'pipe',
// 	// 			shell: true,
// 	// 			env: {
// 	// 				...process.env,
// 	// 				FORCE_COLOR: ''
// 	// 			}
// 	// 		});

// 	// 		const done = new Promise((resolve, reject) => {
// 	// 			const cleanup = () => {
// 	// 				proc.off('close', resolve);
// 	// 				proc.off('exit', resolve);
// 	// 				proc.stdout.off('data', onStdoutData);
// 	// 				proc.off('error', onError);
// 	// 			};

// 	// 			const onStdoutData = async (data) => {
// 	// 				let message = data.toString();

// 	// 				// remove any colors from message
// 	// 				// @eslint-disable-next-line
// 	// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 	// 				message = message.replace(colorRegex, '');
// 	// 				console.log(message);
// 	// 				const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in ([\d]+) ms/g;
// 	// 				const result = regex.exec(message);
// 	// 				if (result) {
// 	// 					try {
// 	// 						const before = performance.now();
// 	// 						await fetch('http://localhost:3000/');
// 	// 						const after = performance.now();
// 	// 						expect(after - before).toBeLessThan(1000);
// 	// 						resolve();
// 	// 					} catch (e) {
// 	// 						reject(e);
// 	// 					} finally {
// 	// 						cleanup();
// 	// 						proc.kill();
// 	// 					}
// 	// 					console.log('End state reached');
// 	// 				}
// 	// 			};
// 	// 		});

// 	// 		const exitCode = await done;
// 	// 		if (typeof exitCode === 'number') {
// 	// 			expect(exitCode).toBe(0);
// 	// 		}
// 	// 	}
// 	// );
// });
