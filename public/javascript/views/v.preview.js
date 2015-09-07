define([
    'backbone',
    'underscore',
    'models/m.preview'
], function (
    Backbone,
    _,
    PreviewModel
) {
    var PreviewView = Backbone.View.extend({
        el: '.preview.pane',
        model: new PreviewModel(),
        events: {
            'click .refresh': 'render'
        },
        initialize: function (options) {
            this.images = options.images;
            this.canvas = this.$('canvas').get(0);
            this.listenTo(
                this.images,
                'imagesLoaded remove change:visible',
                this.render
            );
            this.listenTo(this.images, 'imagesLoaded', this.setCanvasSize);
            this.progressBar = this.$('.working-overlay progress').get(0);
            this.listenTo(this.images, 'progress', this.updateProgress);
        },
        setCanvasSize: function () {
            var firstImage = this.images.getVisible()[0].get('image');
            this.canvas.width = firstImage.naturalWidth;
            this.canvas.height = firstImage.naturalHeight;
        },
        render: function () {
            var outputCtx = this.canvas.getContext('2d');
            var visibleImages;
            var firstImage;

            if (this.images.length === 0) {
                return this;
            }

            visibleImages = this.images.getVisible();

            if (visibleImages.length === 0) {
                return this;
            }

            firstImage = visibleImages[0].get('image');

            if (!firstImage) {
                return this;
            }

            this.$el.addClass('working');
            this.progressBar.value = 0;

            console.time('processing');
            this.images.getCombinedImageData(function (data) {
                console.timeEnd('processing');
                this.$el.removeClass('working');
                outputCtx.putImageData(data, 0, 0);
            }.bind(this));

            return this;
        },
        updateProgress: function (progress) {
            this.progressBar.value = progress;
        }
    });

    return PreviewView;
});
