import { Router } from "express";
import {
	CUSTOM_TACHI_BMS_TABLES,
	HandleBMSTableBodyRequest,
	HandleBMSTableHTMLRequest,
	HandleBMSTableHeaderRequest,
} from "lib/game-specific/custom-bms-tables";
import { AssignToReqTachiData, GetTachiData } from "utils/req-tachi-data";
import type { RequestHandler } from "express";
import type { TachiBMSTable } from "lib/game-specific/custom-bms-tables";

const router: Router = Router({ mergeParams: true });

const FindCustomBMSTable: RequestHandler = (req, res, next) => {
	const { playtype, tableUrlName } = req.params;

	// find the table
	const customTable = CUSTOM_TACHI_BMS_TABLES.find((t) => t.urlName === tableUrlName);

	if (!customTable) {
		return res.status(404).json({
			success: false,
			description: `No such table with the ID '${tableUrlName}' exists.`,
		});
	}

	if (customTable.playtype !== playtype) {
		return res.status(404).json({
			success: false,
			description: `The table '${tableUrlName}' exists, but is for ${customTable.playtype}, not ${playtype}.`,
		});
	}

	if (customTable.forSpecificUser === true) {
		return res.status(404).json({
			success: false,
			description: `The table '${tableUrlName}' exists, but is user-specific. You should be fetching this table from /api/v1/users/:userID instead of /api/v1/games.`,
		});
	}

	AssignToReqTachiData(req, { customBMSTable: customTable });

	next();
};

/**
 * List all custom BMS tables this instance of Tachi is emitting.
 *
 * @name GET /api/v1/games/bms/:playtype/custom-tables
 */
router.get("/:playtype/custom-tables", (req, res) => {
	const tables: Array<
		Pick<TachiBMSTable, "description" | "forSpecificUser" | "symbol" | "tableName" | "urlName">
	> = [];

	for (const table of CUSTOM_TACHI_BMS_TABLES.filter(
		(e) => e.playtype === req.params.playtype || e.playtype === null
	)) {
		tables.push({
			forSpecificUser: table.forSpecificUser,
			urlName: table.urlName,
			tableName: table.tableName,
			symbol: table.symbol,
			description: table.description,
		});
	}

	return res.status(200).json({
		success: true,
		description: `Found ${tables.length} custom table(s).`,
		body: tables,
	});
});

/**
 * Return some HTML for this custom table.
 *
 * @note Since this is the GPT route, trying to fetch user specific custom tables
 * will result in a 404. This applies for all subsequent :tableUrlName routes.
 *
 * @name GET /api/v1/games/bms/:playtype/custom-tables/:tableUrlName
 */
router.get("/:playtype/custom-tables/:tableUrlName", FindCustomBMSTable, (req, res) => {
	const customTable = GetTachiData(req, "customBMSTable");

	// This handles returning a response for us.
	return HandleBMSTableHTMLRequest(customTable, req, res);
});

/**
 * Return the header.json for this custom table.
 *
 * @name GET /api/v1/games/bms/:playtype/custom-tables/:tableUrlName/header.json
 */
router.get("/:playtype/custom-tables/:tableUrlName/header.json", FindCustomBMSTable, (req, res) => {
	const customTable = GetTachiData(req, "customBMSTable");

	// This handles returning a response for us.
	return HandleBMSTableHeaderRequest(customTable, req, res);
});

/**
 * Return the body.json for this custom table.
 *
 * @name GET /api/v1/games/bms/:playtype/custom-tables/:tableUrlName/body.json
 */
router.get("/:playtype/custom-tables/:tableUrlName/body.json", FindCustomBMSTable, (req, res) => {
	const customTable = GetTachiData(req, "customBMSTable");

	// This handles returning a response for us.
	return HandleBMSTableBodyRequest(customTable, req, res);
});

export default router;
