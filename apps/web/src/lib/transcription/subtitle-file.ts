export type TimedCaption = {
	text: string;
	startTime: number;
	duration: number;
};

const TIMING_LINE =
	/^\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})/;

function parseTimestamp({ value }: { value: string }): number {
	const [clock, fraction = "0"] = value.replace(",", ".").split(".");
	const parts = clock.split(":").map(Number);
	const [hours, minutes, seconds] =
		parts.length === 3 ? parts : [0, parts[0], parts[1]];
	// Pad so "5" in "00:01.5" reads as 500 ms, like players do
	const milliseconds = Number(fraction.padEnd(3, "0").slice(0, 3));
	return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

function cleanCueText({ lines }: { lines: string[] }): string {
	return lines
		.join(" ")
		.replace(/<[^>]+>/g, "")
		.replace(/\{\\[^}]*\}/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Parses SRT or WebVTT subtitle files. Returns null when the text has no
 * timing lines, so callers can fall back to one-caption-per-line import.
 */
export function parseTimedCaptions({
	text,
}: {
	text: string;
}): TimedCaption[] | null {
	const blocks = text
		.replace(/^﻿/, "")
		.split(/\r\n?|\n/)
		.reduce<string[][]>(
			(acc, line) => {
				if (line.trim() === "") acc.push([]);
				else acc[acc.length - 1].push(line);
				return acc;
			},
			[[]],
		);

	const captions: TimedCaption[] = [];
	for (const block of blocks) {
		const timingIndex = block.findIndex((line) => TIMING_LINE.test(line));
		if (timingIndex === -1) continue;

		const [, start, end] = block[timingIndex].match(TIMING_LINE) ?? [];
		const startTime = parseTimestamp({ value: start });
		// Subtitle formats are millisecond-precise; drop float noise from subtraction
		const duration =
			Math.round((parseTimestamp({ value: end }) - startTime) * 1000) / 1000;
		const content = cleanCueText({ lines: block.slice(timingIndex + 1) });
		const isUsableCue = content !== "" && duration > 0;
		if (isUsableCue) captions.push({ text: content, startTime, duration });
	}

	return captions.length > 0 ? captions : null;
}
