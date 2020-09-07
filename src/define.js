/**
 * Provides short-hand for creating a definer right away
 *
 * @param {object} [object]  The object to bind the constants to
 *
 * @returns {function}  @see exports.definer
 */


/**
 * Binds a new "constant" property to an input object
 *
 * @param {object} object
 * @param {string} name
 * @param {mixed}  value
 *
 * @return {object}  The input object
 */
function define(object, name, value) {
    var key;

    // if an object, loop the properties for the definitions
    if (typeof name === "object") {
        for (key in name) {
            if (name.hasOwnProperty(key)) {
                module.exports.define(object, key, name[key]);
            }
        }
    // otherwise, just operate on a single property
    } else {
        Object.defineProperty(object, name, {
            value:        value,
            enumerable:   true,
            writable:     false,
            configurable: false
        });
    }

    return object;
};

/**
 * Creates a "definer" function that is bound to an input object (or a new empty object)
 *
 * @param {object} [object]
 *
 * @return {function}
 */
function definer(object) {
    object = object || Object.create(null);
    return function (name, value) {
        return module.exports.define(object, name, value);
    };
};

export {definer,define}