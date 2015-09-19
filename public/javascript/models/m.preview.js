define([
    'backbone'
], function (
    Backbone
) {
    var PreviewModel = Backbone.Model.extend({
        defaults: {
            size: { width: 0, height: 0 },
            progress: 0,
            mergeMode: 'median',
            timeRemaining: 0
        },
        initialize: function () {
            this.on('change:progress', this.updatePrediction);
            this.progressTimestamps = [];
        },
        updatePrediction: function (model, progress) {
            var meanDelta;
            var remaining;

            if (progress === 0) {
                this.progressTimestamps = [];
                this.set('timeRemaining', 0);
                return;
            }

            this.progressTimestamps.push(Date.now());

            // Need at least 2 timestamps to determine how long each 1% takes.
            if (this.progressTimestamps.length < 2) {
                return;
            }

            meanDelta = this.progressTimestamps.
                //slice(-10).
                reduce(function (deltas, timestamp, index, timestamps) {
                    if (index < timestamps.length - 1) {
                        deltas.push(timestamps[index + 1] - timestamp);
                    }
                    return deltas;
                }, []).reduce(function (sum, interval) {
                    return sum + interval;
                }) / (this.progressTimestamps.length - 1);

            remaining = (100 - progress) * meanDelta;
            this.set('timeRemaining', remaining);
        }
    });

    return PreviewModel;
});
