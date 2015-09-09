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
            this.on('change:imageData', this.imageDataReady);
            this.working = false;
            this.cachedBuffer = null;
        },
        imageDataReady: function (model, imageData) {
            if (imageData) {
                this.imagesToLoad -= 1;
            }

            if (this.imagesToLoad === 0) {
                setTimeout(function () {
                    console.timeEnd('load images');
                    this.trigger('imagesLoaded');
                }.bind(this), 0);
            }

            if (this.imagesToLoad < 0) {
                throw new Error('imagesToLoad became less than 0');
            }
        },
        addFromFiles: function (files) {
            this.imagesToLoad += files.length;

            console.time('load images');
            _.forEach(files, function (file) {
                _.defer(this.push.bind(this), {
                    name: file.name,
                    id: _.uniqueId('stackmerge_'),
                    file: file
                });
            }, this);
        },
        getVisible: function (ready) {
            if (this.length === 0) {
                return [];
            }
            return this.filter(function (model) {
                return ready ?
                    model.get('visible') && model.get('imageData') !== null :
                    model.get('visible');
            });
        },

        concatBuffers: function (buffers) {
            var tmp = new Uint8Array(buffers[0].byteLength + buffers[1].byteLength);
            tmp.set(new Uint8Array(buffers[0]), 0);
            tmp.set(new Uint8Array(buffers[1]), buffers[0].byteLength);
            return tmp.buffer;
        },

        callbackIfComplete: function (callback) {
            var buffer;
            if (this.processedBuffers[0] && this.processedBuffers[1]) {
                buffer = this.concatBuffers(this.processedBuffers);
                callback(new ImageData(
                    new Uint8ClampedArray(buffer),
                    this.imageSize.width,
                    this.imageSize.height
                ));
            }
        },

        onWorkerMessage: function (data, id, callback) {
            if (data && data.byteLength) {
                this.processedBuffers[id] = data;
            } else {
                this.trigger('progress');
            }
            this.callbackIfComplete(callback);
        },

        generateCombinedImageData: function (done) {
            var allData = _.map(this.getVisible(true), function (model) {
                return model.get('imageData');
            });
            if (!_.every(this.getVisible(), function (model) {
                return model.get('imageData') !== null;
            })) {
                return null;
            }

            if (!_.isFunction(done)) {
                return null;
            }

            if (this.working) {
                this.terminateWorkers();
            }

            this.worker1 = new Worker(this.workerPath);
            this.worker2 = new Worker(this.workerPath);

            this.worker1.addEventListener('message', function (message) {
                this.onWorkerMessage(message.data, 0, done);
            }.bind(this), false);

            this.worker2.addEventListener('message', function (message) {
                this.onWorkerMessage(message.data, 1, done);
            }.bind(this), false);

            this.working = true;
            this.processedBuffers = [false, false];
            this.trigger('progress', true);
            this.imageSize = {
                width: allData[0].width,
                height: allData[0].height
            };

            console.time('copy data to worker');
            allData.forEach(function (imageData) {
                var len = imageData.data.buffer.byteLength;
                var buffer1 = imageData.data.buffer.slice(0, len / 2);
                var buffer2 = imageData.data.buffer.slice(len / 2, len);
                this.worker1.postMessage(buffer1, [buffer1]);
                this.worker2.postMessage(buffer2, [buffer2]);
            }, this);
            console.timeEnd('copy data to worker');

            this.worker1.postMessage('start');
            this.worker2.postMessage('start');
        },
        terminateWorkers: function () {
            if (this.worker1) {
                this.worker1.terminate();
            }
            if (this.worker2) {
                this.worker2.terminate();
            }
        }
    });

    return ImagesCollection;
});
