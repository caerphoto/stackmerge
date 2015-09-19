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
        workerPaths: {
            edges: '/assets/javascript/workers/edges_processor.js',
            median: '/assets/javascript/workers/median_processor.js'
        },
        initialize: function (attrs, options) {
            this.preview = options.previewModel;

            this.on('change:imageData', this.imageDataReady);
            this.working = false;

            this.numWorkers = 2;

            this.workers = [];
            this.processedBuffers = [];
            // Initialize to null so we can use .map() to operate on the arrays
            // later (map will skip over undefined items).
            _.times(this.numWorkers, function (index) {
                this.workers[index] = null;
                this.processedBuffers[index] = null;
            }, this);
        },
        imageDataReady: function (model, imageData) {
            if (imageData) {
                this.imagesToLoad -= 1;
            }

            if (this.imagesToLoad === 0) {
                this.preview.set('size', {
                    width: imageData.width,
                    height: imageData.height
                });
                setTimeout(function () {
                    this.trigger('imagesLoaded');
                }.bind(this), 50);
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
        getVisible: function (onlyReady) {
            if (this.length === 0) {
                return [];
            }
            return this.filter(function (model) {
                return onlyReady ?
                    model.get('visible') && model.get('imageData') !== null :
                    model.get('visible');
            });
        },

        concatBuffers: function (buffers) {
            var totalSize = buffers.reduce(function (sum, buffer) {
                return sum + buffer.byteLength;
            }, 0);
            var tmp = new Uint8Array(totalSize);
            buffers.forEach(function (buffer, index) {
                var ua = new Uint8Array(buffer);
                tmp.set(ua, index * buffer.byteLength);
            });
            return tmp.buffer;
        },

        callbackIfComplete: function (callback) {
            var buffer;
            var ctx;
            var imageData;

            var allComplete = this.processedBuffers.every(function (buffer) {
                return buffer && buffer.byteLength;
            });
            if (allComplete) {
                // MS Edge doesn't support the ImageData() constructor, so we
                // have to create an ImageData object in a slightly roundabout
                // way.
                buffer = this.concatBuffers(this.processedBuffers);
                ctx = document.createElement('canvas').getContext('2d');
                imageData = ctx.createImageData(
                    this.imageSize.width,
                    this.imageSize.height
                );
                imageData.data.set(new Uint8ClampedArray(buffer));
                callback(imageData);
            }
        },

        onWorkerMessage: function (data, id, callback) {
            if (data && data.byteLength) {
                this.processedBuffers[id] = data;
            } else {
                this.preview.set('progress', this.preview.get('progress') + 1);
            }
            this.callbackIfComplete(callback);
        },

        generateCombinedImageData: function (highQuality, done) {
            var allData = _.map(this.getVisible(true), function (model) {
                return model.get('imageData');
            });
            var blendingMode = this.preview.get('blendingMode');

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

            this.workers = this.workers.map(function (worker, index) {
                worker = new Worker(this.workerPaths[blendingMode]);
                worker.addEventListener('message', function (message) {
                    this.onWorkerMessage(message.data, index, done);
                }.bind(this), false);
                return worker;
            }, this);

            this.working = true;
            this.processedBuffers = this.processedBuffers.map(function () {
                return null;
            });
            this.preview.set('progress', 0);
            this.imageSize = {
                width: allData[0].width,
                height: allData[0].height
            };

            allData.forEach(function (imageData, index) {
                var len = imageData.data.buffer.byteLength;
                var chunkSize = Math.floor((len / 4) / this.numWorkers) * 4;
                var buffer;
                try {
                    this.workers.forEach(function (worker, index, workers) {
                        if (index < workers.length - 1) {
                            // All but the last worker get a rounded down chunk
                            // of the buffer.
                            buffer = imageData.data.buffer.slice(
                                index * chunkSize,
                                index * chunkSize + chunkSize
                            );
                        } else {
                            // Last worker gets the remainder of the buffer.
                            buffer = imageData.data.buffer.slice(
                                index * chunkSize,
                                len
                            );
                        }
                        worker.postMessage(buffer, [buffer]);
                    });
                } catch (e) {
                    console.warn('Failed to create array buffers after',
                        index - 1, 'images');
                }
            }, this);

            this.workers.forEach(function (worker) {
                worker.postMessage({
                    width: this.imageSize.width,
                    highQuality: highQuality,
                    numWorkers: this.numWorkers
                });
            }, this);

        },
        terminateWorkers: function () {
            this.workers.forEach(function (worker) {
                worker.terminate();
            });
        }
    });

    return ImagesCollection;
});
