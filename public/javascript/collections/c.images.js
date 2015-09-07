define([
    'backbone',
    'underscore',
    'quicksort',
    'models/m.image'
], function (
    Backbone,
    _,
    quicksort,
    ImageModel
) {
    var ImagesCollection = Backbone.Collection.extend({
        model: ImageModel,
        imagesToLoad: 0,
        workerPath: '/assets/javascript/median_worker.js',
        initialize: function () {
            this.on('change:canvas', this.canvasReady);
        },
        canvasReady: function (model, canvas) {
            if (canvas) {
                this.imagesToLoad -= 1;
            }

            if (this.imagesToLoad === 0) {
                setTimeout(function () {
                    this.trigger('imagesLoaded');
                }.bind(this), 0);
            }

            if (this.imagesToLoad < 0) {
                throw new Error('imagesToLoad became less than 0');
            }
        },
        addFromFiles: function (files) {
            this.imagesToLoad += files.length;

            _.forEach(files, function (file) {
                this.push({
                    name: file.name,
                    id: _.uniqueId('stackmerge_'),
                    file: file
                });
            }, this);
        },
        getVisibleImages: function (ready) {
            return this.filter(function (model) {
                return ready ?
                    model.get('visible') && model.get('canvas') !== null :
                    model.get('visible');
            });
        },

        getCombinedImageData: function (done) {
            var allData = _.map(this.getVisibleImages(true), function (model) {
                return model.get('imageData');
            });
            if (!_.every(this.getVisibleImages(), function (model) {
                return model.get('canvas') !== null;
            })) {
                return null;
            }

            if (!_.isFunction(done)) {
                return null;
            }

            if (this.worker) {
                this.worker.terminate();
            }
            this.worker = new Worker(this.workerPath);
            this.worker.onmessage = function (message) {
                done(message.data);
            };
            this.worker.postMessage(allData);
        }
    });

    return ImagesCollection;
});
