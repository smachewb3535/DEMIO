import * as __glob_0 from './../Accordion.js';
import * as __glob_1 from './../Translink.js';
import * as __glob_2 from './../TranslinkDB.js';
import * as __glob_3 from './../AudioToggler.js';
import * as __glob_4 from './../Cursor.js';
import * as __glob_5 from './../Modal.js';
import * as __glob_6 from './../ModalToggler.js';
import * as __glob_7 from './../Outline.js';
import * as __glob_8 from './../Parallax.js';
import * as __glob_9 from './../ScrollController.js';
import * as __glob_13 from './../loader.js';
import * as __glob_14 from './../menu.js';
import * as __glob_15 from './../progress.js';
import * as __glob_16 from './../scramble.js';
import * as __glob_17 from './../shapes.js';
import * as __glob_18 from './../splitlines.js';
import * as __glob_19 from './../tags.js';
import * as __glob_20 from './../text.js';
import * as __glob_21 from './../viewport.js';
// @ts-ignore
// const modules = {  };
const modules = { "./../Accordion.js": __glob_0, "./../Translink.js": __glob_1, "./../TranslinkDB.js": __glob_2, "./../AudioToggler.js": __glob_3, "./../Cursor.js": __glob_4, "./../Modal.js": __glob_5, "./../ModalToggler.js": __glob_6, "./../Outline.js": __glob_7, "./../Parallax.js": __glob_8, "./../ScrollController.js": __glob_9, "./../loader.js": __glob_13, "./../menu.js": __glob_14, "./../progress.js": __glob_15, "./../scramble.js": __glob_16, "./../shapes.js": __glob_17, "./../splitlines.js": __glob_18, "./../tags.js": __glob_19, "./../text.js": __glob_20, "./../viewport.js": __glob_21 };
// console.log("modules -> []", modules);

export function createModules(dataAttribute = "module") {
  return Array.from(document.querySelectorAll(`[data-${dataAttribute}]`))
    .map((element) => {
      const attributeValue = (element as HTMLElement).dataset[dataAttribute];
      // const modulePath = `./../${attributeValue}.ts`;
      const modulePaths = [
        `./../${attributeValue}.ts`,
        `./../${attributeValue}.js`
      ];
      const foundModule = modulePaths.find(path => modules[path]);

      const modulePath = foundModule;
      if (modules[modulePath]) {
        const ModuleClass = Object.values(modules[modulePath])[0];
        // console.log("ModuleClass", ModuleClass);
        try {
          return new ModuleClass(element);
        } catch (error) {
          console.warn(
            `Failed to instantiate ${dataAttribute} ${attributeValue}:`,
            error
          );
          return null;
        }
      } else {
        console.warn(`${dataAttribute} not found: ${attributeValue}`);
        return null;
      }
    })
    .filter((item) => item !== null);
}
