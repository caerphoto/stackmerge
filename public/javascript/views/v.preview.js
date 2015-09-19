define([
    'backbone',
    'underscore',
], function (
    Backbone,
    _
) {
    var PreviewView = Backbone.View.extend({
        el: '.preview.pane',
        events: {
            'click .refresh': 'render',
            'click .cancel': 'cancelProcessing',
            'click #zoom-to-fit': 'toggleZoom'
        },
        previewSize: {
            width: 0,
            height: 0
        },
        initialize: function (options) {
            this.images = options.images;
            this.model = options.previewModel;

            this.listenTo(
                this.images,
                'imagesLoaded remove reset change:visible',
                this.render
            );
            this.listenTo(this.model, 'change:mergeMode change:highQuality', this.render);
            this.listenTo(this.model, 'change:size', this.setPreviewSize);
            this.listenTo(this.model, 'change:progress', this.updateProgress);

            this.elPreviewImage = this.$('.preview-image').get(0);
            this.elProgressBar = this.$('.working-overlay progress').get(0);
            this.elCancel = this.$('button.cancel').get(0);
            this.$timing = this.$el.parent().find('.timing span');
            this.$remaining = this.$('.working-overlay .remaining');

            window.addEventListener('resize', _.debounce(this.recenterPreview, 60).bind(this));
        },
        setPreviewSize: function () {
            var size = this.model.get('size');

            this.previewSize.width = size.width;
            this.previewSize.height = size.height;

            // Setting <canvas>.width sets the *logical* canvas width, not it's
            // visual width, which is set with canvas.style.width.
            this.elPreviewImage.width = this.previewSize.width;
            this.elPreviewImage.height = this.previewSize.height;

            this.recenterPreview();
        },
        recenterPreview: function (zoomToFit) {
            var scroller = this.el.querySelector('.preview-scroller');
            var paneSize = {
                width: scroller.clientWidth,
                height: scroller.clientHeight
            };
            // The +2 is to account for the canvas's 1px border
            var computedHeight = zoomToFit ?
                this.elPreviewImage.offsetHeight :
                this.previewSize.height + 2;
            var computedWidth = zoomToFit ?
                this.elPreviewImage.offsetWidth :
                this.previewSize.width + 2;

            if (zoomToFit || this.previewSize.width < paneSize.width) {
                this.elPreviewImage.style.marginLeft =
                    ((paneSize.width - computedWidth) / 2) + 'px';
            } else {
                this.elPreviewImage.style.marginLeft = 0;
            }

            if (zoomToFit || this.previewSize.height < paneSize.height) {
                this.elPreviewImage.style.marginTop =
                    ((paneSize.height - computedHeight) / 2) + 'px';
            } else {
                this.elPreviewImage.style.marginTop = 0;
            }
        },

        formatSeconds: function (seconds) {
            return (seconds < 10 ?
                seconds.toPrecision(2) :
                Math.round(seconds)) + ' seconds';
        },

        formatTiming: function (seconds) {
            var minutes;
            var minuteWord = ' minute ';

            if (seconds < 70) {
                return this.formatSeconds(seconds);
            }

            minutes = Math.floor(seconds / 60);

            if (minutes !== 1) {
                minuteWord = ' minutes ';
            }
            return minutes + minuteWord + this.formatSeconds(seconds % 60);
        },

        render: function () {
            var outputCtx = this.elPreviewImage.getContext('2d');
            var visibleImages;
            var firstImage;
            var timingStart;
            var performance = window.performance;
            var highQuality = this.model.get('highQuality');

            visibleImages = this.images.getVisible();
            this.$el.toggleClass('has-images', visibleImages.length > 0);
            if (this.images.length === 0 && visibleImages.length === 0) {
                return this;
            }

            firstImage = visibleImages[0].get('imageData');

            if (!firstImage) {
                return this;
            }

            this.$el.addClass('working');
            this.elCancel.focus();
            this.elProgressBar.value = 0;

            timingStart = performance && performance.now() || Date.now();
            this.model.startedAt = Date.now();
            this.images.generateCombinedImageData(highQuality, function (data) {
                var timingEnd = performance && performance.now() || Date.now();
                var timing = ((timingEnd - timingStart) / 1000);
                outputCtx.putImageData(data, 0, 0);
                this.$el.removeClass('working');
                this.$timing.text(this.formatTiming(timing));
                this.$timing.parent().addClass('has-time');
            }.bind(this));

            return this;
        },
        updateProgress: function (model, progress) {
            var remaining = model.get('timeRemaining') / 1000;
            this.elProgressBar.value = progress;
            this.$remaining.text(this.formatTiming(remaining));
        },
        cancelProcessing: function () {
            this.$el.removeClass('working');
            this.images.terminateWorkers();
        },
        toggleZoom: function (evt) {
            this.$el.toggleClass('zoom-to-fit', evt.target.checked);
            this.recenterPreview(evt.target.checked);
        }
    });

    return PreviewView;
});
