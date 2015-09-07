define([
    'backbone',
    'underscore',
    'models/m.image'
], function (
    Backbone,
    _,
    ImageModel
) {
    var ImagesCollection = Backbone.Collection.extend({
        model: ImageModel,
        imagesToLoad: 0,
        workerPath: '/assets/javascript/median_worker.js',
        initialize: function () {
            this.on('change:canvas', this.canvasReady);
            this.worker = new Worker(this.workerPath);
            this.working = false;
        },
        canvasReady: function (model, canvas) {
            if (canvas) {
                this.imagesToLoad -= 1;
            }

            if (this.imagesToLoad === 0) {
                setTimeout(function () {
                    console.timeEnd('loading');
                    this.trigger('imagesLoaded');
                }.bind(this), 0);
            }

            if (this.imagesToLoad < 0) {
                throw new Error('imagesToLoad became less than 0');
            }
        },
        addFromFiles: function (files) {
            this.imagesToLoad += files.length;

            console.time('loading');
            _.forEach(files, function (file) {
                this.push({
                    name: file.name,
                    id: _.uniqueId('stackmerge_'),
                    file: file
                });
            }, this);
        },
        getVisible: function (ready) {
            return this.filter(function (model) {
                return ready ?
                    model.get('visible') && model.get('canvas') !== null :
                    model.get('visible');
            });
        },

        getCombinedImageData: function (done) {
            var allData = _.map(this.getVisible(true), function (model) {
                return model.get('imageData');
            });
            if (!_.every(this.getVisible(), function (model) {
                return model.get('canvas') !== null;
            })) {
                return null;
            }

            if (!_.isFunction(done)) {
                return null;
            }

            if (this.working) {
                this.worker.terminate();
                this.worker = new Worker(this.workerPath);
            }

            this.worker.onmessage = function (message) {
                if (message.data.width) {
                    this.working = false;
                    done(message.data);
                } else if (typeof message.data === 'number') {
                    this.trigger('progress', message.data);
                }
            }.bind(this);

            this.working = true;

            allData.forEach(function (imageData) {
                var buffer = imageData.data.buffer.slice();
                this.worker.postMessage(buffer, [buffer]);
            }, this);

            this.worker.postMessage({
                width: allData[0].width,
                height: allData[0].height
            });

            this.worker.postMessage('start');
        }
    });

    return ImagesCollection;
});
