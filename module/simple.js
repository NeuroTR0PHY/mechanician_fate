/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { SimpleActor } from "./actor.js";
import { SimpleItemSheet } from "./item-sheet.js";
import { SimpleActorSheet } from "./actor-sheet.js";
import { FATE } from "./module/config.js";
import { preloadHandlebarsTemplates } from "./module/templates.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
    console.log(`Initializing Simple Worldbuilding System`);

    //from fate.js
    CONFIG.FATE = FATE;
    //from fate.js
    //await preloadHandlebarsTemplates();

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
	  formula: "1d20",
    decimals: 2
  };

	// Define custom Entity classes
  CONFIG.Actor.entityClass = SimpleActor;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("core", SimpleActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("core", SimpleItemSheet, {makeDefault: true});

  // Register system settings
  game.settings.register("mechanician_fate", "macroShorthand", {
    name: "Shortened Macro Syntax",
    hint: "Enable a shortened macro syntax which allows referencing attributes directly, for example @str instead of @attributes.str.value. Disable this setting if you need the ability to reference the full attribute model, for example @attributes.str.label.",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });
});

// Adds a simple Handlebars "for loop" block helper
Handlebars.registerHelper('for', function (times, block) {
    var accum = '';
    for (let i = 0; i < times; i++) {
        block.data.index = i;
        block.data.num = i + 1;
        accum += block.fn(i);
    }
    return accum;
});
