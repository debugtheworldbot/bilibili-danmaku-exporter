CREATE TABLE `exportHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` varchar(32) NOT NULL,
	`videoTitle` text,
	`danmakuCount` int NOT NULL DEFAULT 0,
	`exportedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exportHistory_id` PRIMARY KEY(`id`)
);
