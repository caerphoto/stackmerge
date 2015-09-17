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

            this.worker1 = new Worker(this.workerPaths[blendingMode]);
            this.worker2 = new Worker(this.workerPaths[blendingMode]);

            this.worker1.addEventListener('message', function (message) {
                this.onWorkerMessage(message.data, 0, done);
            }.bind(this), false);
            this.worker2.addEventListener('message', function (message) {
                this.onWorkerMessage(message.data, 1, done);
            }.bind(this), false);

            this.working = true;
            this.processedBuffers = [false, false];
            this.preview.set('progress', 0);
            this.imageSize = {
                width: allData[0].width,
                height: allData[0].height
            };

            allData.forEach(function (imageData) {
                var len = imageData.data.buffer.byteLength;
                var buffer1 = imageData.data.buffer.slice(0, len / 2);
                var buffer2 = imageData.data.buffer.slice(len / 2, len);
                this.worker1.postMessage(buffer1, [buffer1]);
                this.worker2.postMessage(buffer2, [buffer2]);
            }, this);

            this.worker1.postMessage(allData[0].width);
            this.worker2.postMessage(allData[0].width);

            if (highQuality) {
                this.worker1.postMessage('start nice');
                this.worker2.postMessage('start nice');
            } else {
                this.worker1.postMessage('start fast');
                this.worker2.postMessage('start fast');
            }
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
