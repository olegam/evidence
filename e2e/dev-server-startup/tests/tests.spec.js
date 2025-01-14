import { describe, it, expect } from 'vitest';
import child_process from 'child_process';

const allowedTimeout = process.env.GITHUB_ACTIONS ? 1000 * 30 /* 30 seconds */ : 15000;
const goalStartupTime = (allowedTimeout * 2) / 3;

if (process.env.GITHUB_ACTIONS) {
	console.log('Running on GitHub Actions');
}

describe('Dev Server Startup', () => {
	it('Should start the dev server', { timeout: allowedTimeout }, async () => {
		const proc = child_process.spawn('npm', ['run', 'dev'], {
			stdio: 'pipe',
			shell: true,
			env: {
				...process.env,
				FORCE_COLOR: ''
			}
		});

		console.log('Starting dev server');

		const done = new Promise((resolve, reject) => {
			const cleanup = () => {
				proc.off('close', resolve);
				proc.off('exit', resolve);
				proc.stdout.off('data', onStdoutData);
				proc.off('error', onError);
			};

			const onStdoutData = (data) => {
				let message = data.toString();

				// remove any colors from message
				// @eslint-disable-next-line
				const colorRegex = /\x1b\[[0-9;]*m/g;
				message = message.replace(colorRegex, '');

				console.log(message);

				const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in ([\d]+) ms/g;
				const result = regex.exec(message);
				if (result) {
					const startupTime = parseInt(result[1]);
					proc.kill();
					try {
						expect(startupTime).toBeLessThan(goalStartupTime);
						resolve();
					} catch (e) {
						reject(e);
					} finally {
						cleanup();
					}
					console.log('End state reached');
				}
			};
			const onStderrData = (data) => {
				let message = data.toString();

				// remove any colors from message
				const colorRegex = /\x1b\[[0-9;]*m/g;
				message = message.replace(colorRegex, '');
				if (message.includes("error while starting dev server"))  {
					cleanup();
					reject(new Error(message));
					return;
				}

				console.error(message);
			};
			const onError = (err) => {
				console.error(err);
				cleanup();
				reject(err);
			};

			proc.on('close', resolve);
			proc.on('exit', resolve);
			proc.on('error', onError);
			proc.stdout.on('data', onStdoutData);
			proc.stderr.on('data', onStderrData);
		});

		const exitCode = await done;
		if (typeof exitCode === 'number') {
			expect(exitCode).toBe(0);
		}
		// dev server should start within 5 seconds
	});
});
