define([
    'models/m.base'
], function (
    BaseModel
) {
    var PreviewModel = BaseModel.extend({
        defaults: {
            size: { width: 0, height: 0 },
            progress: 0,
            mergeMode: 'median',
            timeRemaining: 0,
            timeAtProgressStart: null,

            // This is what gets shown on the 'working' popup
            processingMessage: 'Working'
        },
        initialize: function () {
            this.on('change:progress', this.updatePrediction);
            this.progressDeltas = [];
        },
        updatePrediction: function (model, progress) {
            var meanDelta;
            var remaining;
            var timeAtStart = this.get('timeAtProgressStart');

            if (progress === 0) {
                this.progressDeltas = [];
                this.set('timeRemaining', 0);
                this.set('timeAtProgressStart', null);
                return;
            }

            if (timeAtStart === null) {
                timeAtStart = Date.now();
                this.set('timeAtProgressStart', timeAtStart);
            }
            this.progressDeltas.push((Date.now() - timeAtStart) / progress);

            meanDelta = this.progressDeltas.reduce(function (sum, delta) {
                return sum + delta;
            }) / this.progressDeltas.length;

            remaining = (100 - progress) * meanDelta;
            this.set('timeRemaining', remaining);
        }
    });

    return PreviewModel;
});
