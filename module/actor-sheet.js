/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
//import { FATE } from './config.js';
export class SimpleActorSheet extends ActorSheet {
    get actorType() {
        return this.actor.data.type;
    }
    //from CoreSheet.js
    constructor() {
        super(...arguments);
        this.preventClick = false;
    }

    //from BaseSheet.js
    activateListeners(html) {
        super.activateListeners(html);
        this._replaceSelect(html);
        // Disable custom elements when User is not the Owner
        if (!this.actor.owner) {
            html.find('div[contenteditable="true"][data-edit]').attr('contenteditable', 'false');
            html.find('label.stress-box').addClass('disabled');
            html.find('.artwork img').addClass('disabled');
            html.find('.artwork img').off();
        }
        if (this.options.submitOnChange) {
            // Enable contenteditable divs to submit the form when they lose focus
            html.find('div[contenteditable="true"][data-edit]').on('focusout', this._onSubmit.bind(this));
            //html.find('.approach-select .options li').on('click', this._onSubmit.bind(this));
        }
        // Submit when changing the state of checkboxes
        html.find('input[type="checkbox"]').on('change', (ev) => this._onSubmit(ev));
        // When creating an Item
        html.find('.item-create').on('click', (ev) => {
            ev.preventDefault();
            const header = ev.currentTarget;
            const type = header.dataset.type;
            const itemData = {
                name: `New ${type.capitalize()}`,
                type,
                data: duplicate(header.dataset),
            };
            delete itemData.data['type'];
            this.actor.createOwnedItem(itemData);
        });
        // When editing an Item
        html.find('.item-edit').on('click', (ev) => {
            ev.preventDefault();
            const li = $(ev.currentTarget).closest('.item');
            const item = this.actor.getOwnedItem(li.attr('data-item-id'));
            item.sheet.render(true);
        });
        // When deleting an Item
        html.find('.item-delete').on('click', (ev) => {
            ev.preventDefault();
            const li = $(ev.currentTarget).closest('.item');
            li.slideUp(200, () => {
                this.actor.deleteOwnedItem(li.attr('data-item-id'));
            });
        });
    }

    //from BaseSheet.js
    _replaceSelect(html) {
        const selects = html.find('select.approach');
        const fadeDuration = 200;
        selects.each(function () {
            // Cache the select and options elements
            const select = $(this);
            const options = select.children('option');
            // Wrap the select
            select.wrap('<div class="approach-select"></div>');
            // Create the new element to display the selected value
            const selected = $('<div />', {
                class: 'selected',
                tabIndex: 0,
                text: options.siblings(':selected').text(),
            }).insertAfter(select);
            // Create the new element to show the options
            const list = $('<ul />', {
                class: 'options',
            }).insertAfter(selected);
            const hover = $('<div />', {
                class: 'selected-hover',
            }).insertAfter(list);
            // Copy all the options to the new list
            for (const option of options) {
                const $this = $(option);
                $('<li />', {
                    text: $this.text(),
                    value: $this.val(),
                    selected: $this.is(':selected'),
                }).appendTo(list);
            }
            // Cache the new options
            const items = list.children('li');
            if (select.is(':disabled')) {
                selected.addClass('disabled');
                return;
            }
            // Crudely set the initial position of the list and hide it
            html.ready(() => {
                list.show();
                list.css('top', function () {
                    const item = items.siblings('[selected]');
                    const position = item.index() * item.outerHeight() + 1;
                    return `-${position}px`;
                });
                list.hide();
            });
            selected.on('click', function (event) {
                event.stopPropagation();
                $(this).toggleClass('active');
                hover.fadeToggle(fadeDuration);
                list.fadeToggle(fadeDuration);
                list.css('top', function () {
                    const item = items.siblings('[selected]');
                    const position = item.index() * item.outerHeight() + 1;
                    return `-${position}px`;
                });
            });
            hover.on('click', function (event) {
                selected.trigger('focus');
            });
            selected.on('keydown', function (event) {
                const val = select.val();
                const item = items.siblings(`[value="${val}"]`);
                list.children('li').attr('selected', null);
                switch (event.key) {
                    case 'ArrowUp':
                        if (item.prev().length === 0)
                            break;
                        item.prev().attr('selected', '');
                        selected.text(item.prev().text());
                        select.val(item.prev().attr('value'));
                        list.css('top', () => {
                            const val = item.prev().index() *
                                item.prev().outerHeight() +
                                1;
                            return `-${val}px`;
                        });
                        break;
                    case 'ArrowDown':
                        if (item.next().length === 0)
                            break;
                        item.next().attr('selected', '');
                        selected.text(item.next().text());
                        select.val(item.next().attr('value'));
                        list.css('top', () => {
                            const val = item.next().index() *
                                item.next().outerHeight() +
                                1;
                            return `-${val}px`;
                        });
                        break;
                    case 'Enter':
                        if (list.is(':visible')) {
                            select.trigger('change');
                            hover.fadeOut(fadeDuration);
                            list.fadeOut(fadeDuration);
                        }
                        else {
                            hover.fadeIn(fadeDuration);
                            list.fadeIn(fadeDuration);
                        }
                        break;
                    case 'Escape':
                        if (list.is(':visible')) {
                            select.trigger('change');
                            hover.fadeOut(fadeDuration);
                            list.fadeOut(fadeDuration);
                        }
                        break;
                    default:
                        break;
                }
            });
            selected.on('focusout', (event) => {
                event.stopPropagation();
                hover.fadeOut(fadeDuration);
                list.fadeOut(fadeDuration);
            });
            items.on('click', function (event) {
                event.stopPropagation();
                selected.trigger('focus');
                selected.text($(this).text()).removeClass('active');
                select.val($(this).attr('value'));
                select.trigger('change');
                list.children('li').attr('selected', null);
                $(this).attr('selected', '');
            });
            $(document).click(function () {
                selected.removeClass('active');
                select.trigger('change');
                hover.fadeOut(fadeDuration);
                list.fadeOut(fadeDuration);
            });
        });
    }

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
  	  classes: ["mech", "sheet", "actor"],
          template: "systems/mechanician_fate/templates/actor-sheet.html",
      width: 650,
      height: 650,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats"}],
          dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
      resizable: false,
    });
  }

  /* -------------------------------------------- */

/** @override */
/*
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    for ( let attr of Object.values(data.data.attributes) ) {
      attr.isCheckbox = attr.dtype === "Boolean";
    }
    return data;
  }
  */
  getData() {
      const sheetData = super.getData();
      sheetData.dtypes = ["String", "Number", "Boolean"];
      for (let attr of Object.values(sheetData.data.attributes)) {
          attr.isCheckbox = attr.dtype === "Boolean";
      }
      sheetData.cons = {};
      sheetData.physStress = sheetData.character.health;
      sheetData.mentStress = sheetData.character.health.stress.physical;//sheetData.character.health.stress.physical;
      for (const [a, con] of Object.entries(sheetData.data.health.cons)) {
          sheetData.cons[a] = con;
          sheetData.cons[a].label = CONFIG.FATE.consequences[a];
          sheetData.cons[a].stress = CONFIG.FATE.consequenceStress[a];
          if (a === 'mild') {
              const physiqueLevel = this._getHighestStressLevel('physical');
              const willLevel = this._getHighestStressLevel('mental');
              const enabled = physiqueLevel >= 5
                  ? 'Physique'
                  : willLevel >= 5
                  ? 'Will'
                  : null;
              sheetData.cons[a].isMild = true;
              sheetData.cons[a].twoEnabled = enabled
                  ? game.i18n.localize(`FATE.Sheet.Cons.${enabled}`)
                  : '';
              // If disabled, empty the Consequence if it was previously set
              if (!enabled && sheetData.cons[a].two) {
                  sheetData.cons[a].two = '';
                  this.actor.data.data.health.cons.mild.two = '';
                  this.actor.update(this.actor.data);
              }
          }
      }
      return sheetData;
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Add or Remove Attribute
    html.find(".attributes").on("click", ".attribute-control", this._onClickAttributeControl.bind(this));
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options={}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events on an attribute control to modify the composition of attributes in the sheet
   * @param {MouseEvent} event    The originating left click event
   * @private
   */
  async _onClickAttributeControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    const attrs = this.object.data.data.attributes;
    const form = this.form;

    // Add new attribute
    if ( action === "create" ) {
      const nk = Object.keys(attrs).length + 1;
      let newKey = document.createElement("div");
      newKey.innerHTML = `<input type="text" name="data.attributes.attr${nk}.key" value="attr${nk}"/>`;
      newKey = newKey.children[0];
      form.appendChild(newKey);
      await this._onSubmit(event);
    }

    // Remove existing attribute
    else if ( action === "delete" ) {
      const li = a.closest(".attribute");
      li.parentElement.removeChild(li);
      await this._onSubmit(event);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {

    // Handle the free-form attributes list
    const formAttrs = expandObject(formData).data.attributes || {};
    const attributes = Object.values(formAttrs).reduce((obj, v) => {
      let k = v["key"].trim();
      if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
      delete v["key"];
      obj[k] = v;
      return obj;
    }, {});
    
    // Remove attributes which are no longer used
    for ( let k of Object.keys(this.object.data.data.attributes) ) {
      if ( !attributes.hasOwnProperty(k) ) attributes[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("data.attributes")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: this.object._id, "data.attributes": attributes});
    
    // Update the Actor
    return this.object.update(formData);
  }
}
