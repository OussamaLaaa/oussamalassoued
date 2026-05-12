import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

interface CliOptions {
	fps: number;
	crf: number;
	webmCrf: number;
	scenes: string[];
}

const parseArgs = (argv: string[]): CliOptions => {
	const options: CliOptions = {
		fps: 30,
		crf: 22,
		webmCrf: 32,
		scenes: [],
	};

	argv.forEach((arg, index) => {
		if (arg === '--fps') {
			options.fps = Number(argv[index + 1]) || options.fps;
		}
		if (arg === '--crf') {
			options.crf = Number(argv[index + 1]) || options.crf;
		}
		if (arg === '--webm-crf') {
			options.webmCrf = Number(argv[index + 1]) || options.webmCrf;
		}
		if (arg === '--scenes') {
			const raw = argv[index + 1] || '';
			options.scenes = raw.split(',').map((scene) => scene.trim()).filter(Boolean);
		}
	});

	return options;
};

const ensureFfmpeg = () => {
	const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
	if (result.status !== 0) {
		throw new Error('ffmpeg is required. Install it and make sure it is available on PATH.');
	}
};

const getScenesFromFramesDir = (framesRoot: string): string[] => {
	if (!fs.existsSync(framesRoot)) return [];
	return fs
		.readdirSync(framesRoot)
		.filter((folder) => fs.statSync(path.join(framesRoot, folder)).isDirectory());
};

const buildScenePattern = (sceneDir: string) => {
	return path.join(sceneDir, 'ezgif-frame-%03d.avif');
};

const hasFrames = (sceneDir: string): boolean => {
	if (!fs.existsSync(sceneDir)) return false;
	return fs.readdirSync(sceneDir).some((file) => file.endsWith('.avif'));
};

const run = () => {
	const options = parseArgs(process.argv.slice(2));
	const framesRoot = path.resolve(process.cwd(), 'public', 'frames');
	const videosRoot = path.resolve(process.cwd(), 'public', 'videos');

	ensureFfmpeg();

	if (!fs.existsSync(videosRoot)) {
		fs.mkdirSync(videosRoot, { recursive: true });
	}

	const scenes = options.scenes.length > 0 ? options.scenes : getScenesFromFramesDir(framesRoot);
	if (scenes.length === 0) {
		console.log('No scenes found under public/frames.');
		return;
	}

	scenes.forEach((scene) => {
		const sceneDir = path.join(framesRoot, scene);
		if (!hasFrames(sceneDir)) {
			console.warn(`Skipping ${scene}: no AVIF frames found.`);
			return;
		}

		const pattern = buildScenePattern(sceneDir);
		const mp4Output = path.join(videosRoot, `${scene}.mp4`);
		const webmOutput = path.join(videosRoot, `${scene}.webm`);

		console.log(`\n[Video] Encoding ${scene} -> MP4`);
		const mp4Result = spawnSync(
			'ffmpeg',
			[
				'-y',
				'-framerate',
				String(options.fps),
				'-start_number',
				'1',
				'-i',
				pattern,
				'-c:v',
				'libx264',
				'-pix_fmt',
				'yuv420p',
				'-crf',
				String(options.crf),
				'-preset',
				'slow',
				mp4Output,
			],
			{ stdio: 'inherit' }
		);

		if (mp4Result.status !== 0) {
			console.warn(`Failed to encode MP4 for ${scene}.`);
		}

		console.log(`[Video] Encoding ${scene} -> WebM`);
		const webmResult = spawnSync(
			'ffmpeg',
			[
				'-y',
				'-framerate',
				String(options.fps),
				'-start_number',
				'1',
				'-i',
				pattern,
				'-c:v',
				'libvpx-vp9',
				'-crf',
				String(options.webmCrf),
				'-b:v',
				'0',
				webmOutput,
			],
			{ stdio: 'inherit' }
		);

		if (webmResult.status !== 0) {
			console.warn(`Failed to encode WebM for ${scene}.`);
		}
	});
};

run();
