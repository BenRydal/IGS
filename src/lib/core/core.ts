import type p5 from 'p5';
import Papa from 'papaparse';

import { CoreUtils } from './core-utils.js';

import { DataPoint } from '../../models/dataPoint.js';
import { User } from '../../models/user.js';
import { USER_COLORS } from '../constants/index.js';

import UserStore from '../../stores/userStore';
import CodeStore from '../../stores/codeStore.js';
import TimelineStore from '../../stores/timelineStore';
import ConfigStore from '../../stores/configStore.js';
import { get } from 'svelte/store';

let timeline, maxStopLength;
let samplingInterval, smallDataThreshold;

TimelineStore.subscribe((data) => {
	timeline = data;
});

ConfigStore.subscribe((data) => {
	maxStopLength = data.maxStopLength;
	samplingInterval = data.samplingInterval;
	smallDataThreshold = data.smallDataThreshold;
});

export class Core {
	sketch: p5;
	coreUtils: CoreUtils;
	codeData: { code: string; startTime: number; endTime: number }[] = [];

	constructor(sketch: p5) {
		this.sketch = sketch;
		this.coreUtils = new CoreUtils();
	}

	handleUserLoadedFiles = async (event: Event) => {
		const input = event.target as HTMLInputElement;
		for (let i = 0; i < input.files.length; i++) {
			const file = input.files ? input.files[i] : null;
			this.testFileTypeForProcessing(file);
		}
		input.value = ''; // reset input value so you can load same file(s) again in browser
	};

	testFileTypeForProcessing(file: File) {
		const fileName = file ? file.name.toLowerCase() : '';
		if (fileName.endsWith('.csv') || file.type === 'text/csv') this.loadCSVData(file);
		else if (
			fileName.endsWith('.png') ||
			fileName.endsWith('.jpg') ||
			fileName.endsWith('.jpeg') ||
			file.type === 'image/png' ||
			file.type === 'image/jpg' ||
			file.type === 'image/jpeg'
		)
			this.loadFloorplanImage(URL.createObjectURL(file));
		else if (fileName.endsWith('.mp4') || file.type === 'video/mp4') this.prepVideoFromFile(URL.createObjectURL(file));
		else alert('Error loading file. Please make sure your file is an accepted format'); // this should not be possible due to HTML5 accept for file inputs, but in case
	}

	async loadLocalExampleDataFile(folder: string, fileName: string) {
		try {
			const response = await fetch(folder + fileName);
			const buffer = await response.arrayBuffer();
			const file = new File([buffer], fileName, {
				type: 'text/csv'
			});
			this.loadCSVData(file);
		} catch (error) {
			alert('Error loading CSV file. Please make sure you have a good internet connection');
			console.log(error);
		}
	}

	/**
	 * @param  {MP4 File} input
	 */
	prepVideoFromFile(fileLocation) {
		this.sketch.videoController.createVideoPlayer('File', {
			fileName: fileLocation
		});
	}

	handleExampleDropdown = async (event: any) => {
		ConfigStore.update((store) => ({
			...store,
			maxStopLength: 0
		}));

		const selectedValue = event.target.value;
		await this.loadFloorplanImage(`/data/${selectedValue}/floorplan.png`);

		switch (selectedValue) {
			case 'example-1':
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, 'jordan.csv');
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, 'possession.csv');
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `conversation.csv`);
				this.sketch.videoController.createVideoPlayer('Youtube', { videoId: 'iiMjfVOj8po' });
				break;
			case 'example-2':
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `adhir.csv`);
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `blake.csv`);
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `jeans.csv`);
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `lily.csv`);
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `mae.csv`);
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `conversation.csv`);
				this.sketch.videoController.createVideoPlayer('Youtube', { videoId: 'pWJ3xNk1Zpg' });
				break;
			case 'example-3':
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `teacher.csv`);
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, 'lesson-graph.csv');
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `conversation.csv`);
				this.sketch.videoController.createVideoPlayer('Youtube', { videoId: 'Iu0rxb-xkMk' });
				break;
			case 'example-4':
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `cassandra.csv`);
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `mei.csv`);
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `nathan.csv`);
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `sean.csv`);
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `teacher.csv`);
				await this.loadLocalExampleDataFile(`/data/${selectedValue}/`, `conversation.csv`);
				this.sketch.videoController.createVideoPlayer('Youtube', { videoId: 'OJSZCK4GPQY' });
				break;
		}
	};

	loadCSVData = async (file: File) => {
		Papa.parse(file, {
			dynamicTyping: true,
			skipEmptyLines: 'greedy',
			header: true,
			transformHeader: (h) => {
				return h.trim().toLowerCase();
			},
			complete: (results: any, file: any) => {
				this.processResultsData(results, this.coreUtils.cleanFileName(file.name));
				this.sketch.loop();
			}
		});
	};

	loadFloorplanImage = (path: string) => {
		this.sketch.loadImage(path, (img) => {
			this.sketch.floorPlan.img = img;
			this.sketch.floorPlan.width = img.width;
			this.sketch.floorPlan.height = img.height;
			this.sketch.loop();
		});
	};

	// NOTE: multicode should be processed before single code file as headers of multicode have one additional column
	processResultsData = (results: any, fileName: string) => {
		const csvData = results.data;
		if (this.coreUtils.testMovement(results)) {
			this.updateUsersForMovement(csvData, fileName);
		} else if (this.coreUtils.testMulticode(results)) {
			this.updateUsersForMultiCodes(csvData);
		} else if (this.coreUtils.testSingleCode(results)) {
			this.updateUsersForSingleCodes(csvData, fileName);
		} else if (this.coreUtils.testConversation(results)) {
			// only process conversation if their is at least one user's movement data loaded
			if (this.isAnyUserMovementLoaded()) this.updateUsersForConversation(csvData);
		} else {
			alert('Error loading CSV file. Please make sure your file is a CSV file formatted with correct column headers');
		}

		UserStore.update((currentUsers) => {
			const users = [...currentUsers];
			users.forEach((user) => {
				user.dataTrail.sort((a, b) => (a.time > b.time ? 1 : -1));
				this.updateStopValues(user.dataTrail);
				this.updateCodeValues(user.dataTrail);
			});
			return users;
		});
	};

	isAnyUserMovementLoaded() {
		const users = get(UserStore);
		return users.some((user) => user.movementIsLoaded);
	}

	updateUsersForMovement = (csvData: any, userName: string) => {
		let endTime = 0;

		UserStore.update((currentUsers) => {
			let users = [...currentUsers];
			let user = users.find((user) => user.name === userName);

			if (!user) {
				user = this.createNewUser(users, userName);
				users.push(user);
			}
			user.movementIsLoaded = true;
			const lastTime = csvData[csvData.length - 1]?.time;
			if (endTime < lastTime) endTime = lastTime;

			// Use samplingInterval and smallDataThreshold from ConfigStore
			if (csvData.length <= smallDataThreshold) {
				csvData.forEach((row) => {
					user.dataTrail.push(new DataPoint('', row.time, row.x, row.y));
				});
			} else {
				let lastSampledTime = csvData[0]?.time;
				csvData.forEach((row) => {
					if (row.time - lastSampledTime >= samplingInterval) {
						user.dataTrail.push(new DataPoint('', row.time, row.x, row.y));
						lastSampledTime = row.time;
					}
				});
			}
			return users;
		});
		this.updateTimelineValues(endTime);
	};

	updateUsersForConversation = (csvData: any) => {
		UserStore.update((currentUsers) => {
			const users = [...currentUsers];
			const allUsersMovementData = this.getAllUsersMovementData(users);
			csvData.forEach((row: any) => {
				let curUser = users.find((curUser) => curUser.name === row.speaker.toLowerCase());

				if (!curUser) {
					curUser = this.createNewUser(users, row.speaker.toLowerCase());
					users.push(curUser);
				}
				curUser.conversationIsLoaded = true;

				// If the current conversation turn has movement loaded, use that dataTrail to get coordinate data and add the DataPoint
				// Or else, use allUsersMovementData to get coordinate data and then add the DataPoint to the current user's dataTrail
				if (curUser.movementIsLoaded) {
					this.addDataPointClosestByTimeInSeconds(curUser.dataTrail, new DataPoint(row.talk, row.time), curUser.dataTrail);
					console.log('fileName matched');
				} else {
					this.addDataPointClosestByTimeInSeconds(curUser.dataTrail, new DataPoint(row.talk, row.time), allUsersMovementData);
					console.log('no match');
				}
			});
			return users;
		});
	};

	// Collect valid data points with x and y coordinates across all users' dataTrails to process conversation data
	getAllUsersMovementData = (users) => {
		const validPoints = [];
		users.forEach((user) => {
			user.dataTrail.forEach((point) => {
				if (point.x != null && point.y != null) {
					validPoints.push(point);
				}
			});
		});
		return validPoints.sort((a, b) => a.time - b.time); // Ensure it's sorted by time for binary search later
	};

	addDataPointClosestByTimeInSeconds(dataTrail: DataPoint[], newDataPoint: DataPoint, validPointsWithCoordinates: DataPoint[]) {
		this.addMissingCoordinates(newDataPoint, validPointsWithCoordinates);
		dataTrail.push(newDataPoint);
	}

	addMissingCoordinates(newDataPoint: DataPoint, validPointsWithCoordinates: DataPoint[]) {
		const closestDataPoint = this.findClosestPoint(newDataPoint, validPointsWithCoordinates);
		if (closestDataPoint) {
			this.copyDataPointAttributes(closestDataPoint, newDataPoint);
		} else {
			newDataPoint.x = 0;
			newDataPoint.y = 0;
			console.log('No valid data points with x and y found to copy');
		}
	}

	// Implementation of binary search
	findClosestPoint(dataPoint: DataPoint, validPoints: DataPoint[]) {
		const targetTime = dataPoint.time;
		if (validPoints.length === 0) {
			console.log('Valid data points array empty');
			return null;
		}

		let left = 0,
			right = validPoints.length - 1;

		while (left <= right) {
			const mid = Math.floor((left + right) / 2);
			if (validPoints[mid].time === targetTime) return validPoints[mid];
			validPoints[mid].time < targetTime ? (left = mid + 1) : (right = mid - 1);
		}

		// Handle out-of-bounds cases
		if (left >= validPoints.length) return validPoints[right];
		if (right < 0) return validPoints[left];

		// Return the closest of the two
		return Math.abs(validPoints[left].time - targetTime) < Math.abs(validPoints[right].time - targetTime) ? validPoints[left] : validPoints[right];
	}

	copyDataPointAttributes = (sourceDataPoint: DataPoint, targetDataPoint: DataPoint) => {
		targetDataPoint.x = sourceDataPoint.x;
		targetDataPoint.y = sourceDataPoint.y;
		targetDataPoint.stopLength = sourceDataPoint.stopLength;
		targetDataPoint.codes = sourceDataPoint.codes;
	};

	createNewUser(users: User[], userName: string) {
		const availableColors = USER_COLORS.filter((color) => !users.some((u) => u.color === color));
		const userColor = availableColors.length > 0 ? availableColors[0] : '#000000'; // Default to black if no more unique colors available
		return new User([], userColor, true, userName);
	}

	updateStopValues(data: DataPoint[]) {
		let curMaxStopLength = 0; // holds length of stop for each calculated stop segment

		for (let i = 0; i < data.length; i++) {
			let cumulativeTime = 0;
			let j = i;
			while (j < data.length && data[j].x === data[i].x && data[j].y === data[i].y) {
				cumulativeTime = data[j].time - data[i].time;
				j++;
			}

			if (cumulativeTime > curMaxStopLength) {
				curMaxStopLength = cumulativeTime;
			}

			for (let k = i + 1; k < j; k++) {
				data[k].stopLength = cumulativeTime;
			}
			i = j - 1;
		}
		ConfigStore.update((store) => ({
			...store,
			maxStopLength: Math.max(store.maxStopLength, curMaxStopLength)
		}));
	}

	updateUsersForSingleCodes = (csvData: any, fileName: string) => {
		const codeName = fileName.replace(/\.[^/.]+$/, '').toLowerCase();
		const uniqueCodes = [codeName];

		csvData.forEach((row: any) => {
			const startTime = parseFloat(row.start);
			const endTime = parseFloat(row.end);
			this.codeData.push({ code: codeName, startTime, endTime });
		});

		this.updateCodeStore(uniqueCodes);
	};

	updateUsersForMultiCodes = (csvData: any) => {
		const uniqueCodes: string[] = [];

		csvData.forEach((row: any) => {
			const code = row.code.toLowerCase();
			if (!uniqueCodes.includes(code)) uniqueCodes.push(code);
			const startTime = parseFloat(row.start);
			const endTime = parseFloat(row.end);
			this.codeData.push({ code, startTime, endTime });
		});
		this.updateCodeStore(uniqueCodes);
	};

	updateTimelineValues = (endTime: number) => {
		TimelineStore.update((timeline) => {
			timeline.setCurrTime(0);
			timeline.setStartTime(0);
			timeline.setEndTime(endTime);
			timeline.setLeftMarker(0);
			timeline.setRightMarker(endTime);
			return timeline;
		});
	};

	updateCodeValues = (dataPoints: DataPoint[]) => {
		dataPoints.forEach((dataPoint) => {
			dataPoint.codes = [];
		});

		this.codeData.forEach((codeEntry) => {
			const { code, startTime, endTime } = codeEntry;
			this.updateDataTrailSegmentsWithCodes(dataPoints, code, startTime, endTime);
		});
	};

	updateDataTrailSegmentsWithCodes = (dataPoints: DataPoint[], code: string, startTime: number, endTime: number) => {
		// Find the first data point with time >= startTime
		const startIndex = dataPoints.findIndex((dataPoint) => dataPoint.time !== null && dataPoint.time >= startTime);

		// Find the last data point with time <= endTime
		const endIndex = dataPoints.findLastIndex((dataPoint) => dataPoint.time !== null && dataPoint.time <= endTime);

		if (startIndex === -1 || endIndex === -1) return;

		// Update datapoints FROM the start and TO the end time to include the code
		for (let i = startIndex; i <= endIndex; i++) {
			if (!dataPoints[i].codes.includes(code)) {
				dataPoints[i].codes.push(code);
			}
		}
	};

	updateCodeStore = (uniqueCodes: string[]) => {
		CodeStore.update((currentEntries) => {
			if (!currentEntries.some((entry) => entry.code === 'no codes')) {
				currentEntries.unshift({
					code: 'no codes',
					color: '#808080',
					enabled: true
				});
			}

			const existingCodes = currentEntries.map((entry) => entry.code);
			const newEntries = uniqueCodes
				.filter((code) => !existingCodes.includes(code))
				.map((code, index) => ({
					code,
					color: USER_COLORS[(index + currentEntries.length) % USER_COLORS.length],
					enabled: true
				}));

			return [...currentEntries, ...newEntries];
		});

		ConfigStore.update((currentConfig) => ({
			...currentConfig,
			dataHasCodes: true
		}));
	};
}
