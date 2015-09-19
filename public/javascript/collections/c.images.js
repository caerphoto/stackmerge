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
        numImagesToLoad: 0,
        workerPaths: {
            edges: '/assets/javascript/workers/edges_processor.js',
            median: '/assets/javascript/workers/median_processor.js'
        },
        initialize: function (attrs, options) {
            this.preview = options.previewModel;

            this.on('change:imageData', this.imageDataReady);
            this.working = false;

            this.numWorkers = 4;

            this.workers = [];
            this.processedBuffers = [];
        },
        imageDataReady: function (model, imageData) {
            if (imageData) {
                this.numImagesToLoad -= 1;
                this.preview.set('progress', this.preview.get('progress') + this.percentPerImage);
            }

            if (this.numImagesToLoad === 0) {
                this.preview.set('size', {
                    width: imageData.width,
                    height: imageData.height
                });
                setTimeout(function () {
                    this.trigger('imagesLoaded');
                }.bind(this), 50);
            }

            if (this.numImagesToLoad < 0) {
                throw new Error('numImagesToLoad became less than 0');
            }
        },
        addFromFiles: function (files) {
            this.numImagesToLoad += files.length;
            this.percentPerImage = 100 / this.numImagesToLoad;

            this.preview.set({
                message: 'Loading',
                progress: 0
            });

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

        onWorkerMessage: function (worker, data, callback) {
            if (data && data.byteLength) {
                this.processedBuffers[worker.index] = data;
            } else {
                this.preview.set('progress', this.preview.get('progress') + 1);
            }
            this.callbackIfComplete(callback);
        },

        sendImageData: function (allData) {
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
                        index - 1, 'images, possibly due to memory restrictions:');
                    console.log(e);
                }

            }, this);
        },

        setupWorkersAndBuffers: function (fnDone, mergeMode) {
            _.times(this.numWorkers, function (index) {
                this.workers[index] = new Worker(this.workerPaths[mergeMode]);
                (function (worker, collection) {
                    worker.addEventListener('message', function (message) {
                        collection.onWorkerMessage(worker, message.data, fnDone);
                    }, false);
                }(this.workers[index], this));

                this.workers[index].index = index; // iiiiiii!

                this.processedBuffers[index] = null;
            }, this);
        },

        generateCombinedImageData: function (highQuality, fnDone) {
            var allData = _.map(this.getVisible(true), function (model) {
                return model.get('imageData');
            });
            var mergeMode = this.preview.get('mergeMode');

            if (!_.every(this.getVisible(), function (model) {
                return model.get('imageData') !== null;
            })) {
                return null;
            }

            if (!_.isFunction(fnDone)) {
                return null;
            }

            if (this.working) {
                this.terminateWorkers();
            }

            this.setupWorkersAndBuffers(fnDone, mergeMode);

            this.working = true;
            this.preview.set('progress', 0);
            this.imageSize = {
                width: allData[0].width,
                height: allData[0].height
            };

            this.sendImageData(allData);

            this.workers.forEach(function (worker) {
                worker.postMessage({
                    imageWidth: this.imageSize.width,
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
