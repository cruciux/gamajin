var assert = require("assert"); // node.js core module

var infiniteNumber = require('../src/game/modules/infinite_number');

describe('infiniteNumber', function() {
  describe('#increase()', function() {
    it('should increase the number by one when in the mid range', function(){
      assert.equal(100, infiniteNumber.increase(99));
    });
    it('should reset back to zero when the number reaches the wrap number', function(){
      assert.equal(0, infiniteNumber.increase(9999));
    });
  });
  describe('#decrease()', function() {
    it('should decrease the number by one when in the mid range', function(){
      assert.equal(150, infiniteNumber.decrease(151));
    });
    it('should reset back to the number below the wrap number when going below zero', function(){
      assert.equal(9999, infiniteNumber.decrease(0));
    });
  });
  describe('#isFirstBeforeSecond()', function() {
  	[[20,30], [9999,0], [1000,5000], [6000,1]].forEach(function(pair) {
  		it('first should be before second', function(){
      		assert.equal(true, infiniteNumber.isFirstBeforeSecond(pair[0], pair[1]));
	    });
  	});
  	[[100, 10], [6000,5000], [2, 9888]].forEach(function(pair) {
  		it('first should not be before second', function(){
      		assert.equal(false, infiniteNumber.isFirstBeforeSecond(pair[0], pair[1]));
	    });
  	});
  });
  describe('#loopInclusively()', function() {
    it('should loop inclusively the correct number of times', function(){
      var expectedValues = [5,6,7,8];
      var actualValues = [];
      infiniteNumber.loopInclusively(5,8,function(number) {
        actualValues.push(number);
      });
      assert.deepEqual(expectedValues, actualValues);
    });
    it('should loop inclusively the correct number of times', function(){
      var expectedValues = [9998,9999,0,1,2];
      var actualValues = [];
      infiniteNumber.loopInclusively(9998,2,function(number) {
        actualValues.push(number);
      });
      assert.deepEqual(expectedValues, actualValues);
    });
  });
});