/*
 * A virtual dice roller that accepts standard dice notation
 * https://gist.github.com/thebinarypenguin/5811014
 *
 * Dice Notation
 *
 *   [Num Dice] d <Num Sides> [Modifier]
 *
 *
 * Num Dice  - Number of dice to roll (optional)
 *               Accepted Range : 0 - infinity
 *               Default        : 1
 *
 * Num Sides - Number of sides on each dice (required)
 *               Accepted Range : 1 - infinity
 *
 * Modifier  - Arithmetic modifier (optional)
 *               Accepted Range : -infinity - +infinity
 *               Default        : +0
 *
 *
 * Examples
 *
 *   d6     - Roll 1 6-sided dice
 *   2d8    - Roll 2 8-sided dice
 *   d4+1   - Roll 1 4-sided dice and add 1
 *   3d10-5 - Roll 3 10-sided dice and subtract 5
 *
 *   The following are valid but stupid
 *
 *   0d6    - Roll 0 6-sided dice
 *   d1     - Roll 1 1-sided dice
 *
 */
var DiceRoller = function() {

  // Private

  // Create a "data type" to represent the roll results
  var ResultSet = function() {
    this.rolls = [];
    this.modifier = 0;
    this.total = 0;
  };

  // Add a toString method for convenience
  ResultSet.prototype.toString = function() {
    var rolls = this.rolls.join(' + ');
    var modifier = this.modifier;
    var total = this.total;

    if (modifier > 0) {
      return rolls + ' + ' + modifier + ' = ' + total;
    } else if (modifier < 0) {
      return rolls + ' - ' + Math.abs(modifier) + ' = ' + total;
    } else {
      return (rolls == total) ? total : rolls + ' = ' + total;
    }
  };

  /**
   * Parse formula into component parts
   * Returns object on success and null on failure
   */
  var parse = function(formula) {
    var matches = formula.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
    if (matches === null || matches[2] == 0) {
      return null;
    }

    var rolls    = (matches[1] !== undefined) ? (matches[1] - 0) : 1;
    var sides    = (matches[2] !== undefined) ? (matches[2] - 0) : 0;
    var modifier = (matches[3] !== undefined) ? (matches[3] - 0) : 0;

    return { rolls: rolls, sides: sides, modifier: modifier };
  };

  // Public

  /**
   * Roll the dice described in formula
   * Returns a ResultSet on success and null on failure
   */
  this.roll = function(formula) {
    var pieces = parse(formula);
    if (pieces === null) {
      return null;
    }

    var results = new ResultSet();

    // rolls
    for (var i = 0; i < pieces.rolls; i++) {
      results.rolls[i] = (1 + Math.floor(Math.random() * pieces.sides));
    }

    // modifier
    results.modifier = pieces.modifier;

    // total
    for (var i = 0; i < results.rolls.length; i++) {
      results.total += results.rolls[i];
    }
    results.total += pieces.modifier;

    return results;
  };

  /**
   * Validates the format of formula
   * Returns true on success and false on failure
   */
  this.validate = function(formula) {
    return (parse(formula) === null) ? false : true ;
  };

};

module.exports = DiceRoller
