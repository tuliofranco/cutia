import { expect, test } from "bun:test";
import { parseTimedCaptions } from "./subtitle-file";

test("parses SRT cues with comma milliseconds and multi-line text", () => {
	const srt = [
		"1",
		"00:00:01,000 --> 00:00:02,500",
		"Oi, tudo bem?",
		"",
		"2",
		"00:00:03,200 --> 00:00:05,000",
		"Hoje eu vou mostrar",
		"como editar",
		"",
	].join("\r\n");

	expect(parseTimedCaptions({ text: srt })).toEqual([
		{ text: "Oi, tudo bem?", startTime: 1, duration: 1.5 },
		{ text: "Hoje eu vou mostrar como editar", startTime: 3.2, duration: 1.8 },
	]);
});

test("parses WebVTT without hours, cue settings, tags and header blocks", () => {
	const vtt = [
		"﻿WEBVTT",
		"",
		"NOTE gerado pelo pipeline",
		"",
		"intro",
		"00:01.5 --> 00:03.000 align:start position:10%",
		"<v Túlio>Olá</v> <b>mundo</b>",
		"",
		"01:00:00.000 --> 01:00:02.000",
		"{\\an8}No topo",
	].join("\n");

	expect(parseTimedCaptions({ text: vtt })).toEqual([
		{ text: "Olá mundo", startTime: 1.5, duration: 1.5 },
		{ text: "No topo", startTime: 3600, duration: 2 },
	]);
});

test("skips empty or zero-length cues", () => {
	const srt = [
		"1",
		"00:00:01,000 --> 00:00:01,000",
		"zero",
		"",
		"2",
		"00:00:02,000 --> 00:00:03,000",
		"",
		"3",
		"00:00:04,000 --> 00:00:05,000",
		"fica",
	].join("\n");

	expect(parseTimedCaptions({ text: srt })).toEqual([
		{ text: "fica", startTime: 4, duration: 1 },
	]);
});

test("returns null for plain text so line-by-line import still works", () => {
	expect(parseTimedCaptions({ text: "linha um\nlinha dois" })).toBeNull();
	expect(parseTimedCaptions({ text: "" })).toBeNull();
});
