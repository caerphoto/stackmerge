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
        initialize: function (options) {
            this.images = options.images;
            this.canvas = this.$('canvas').get(0);
            this.listenTo(this.images, 'imagesLoaded remove change:visible', this.render);
            this.progressBar = this.$('.working-overlay progress').get(0);
            this.listenTo(this.images, 'progress', this.updateProgress);
        },
        render: function () {
            var outputCtx = this.canvas.getContext('2d');
            var visibleImages;
            var firstImage;

            if (this.images.length === 0) {
                return this;
            }

            visibleImages = this.images.getVisibleImages();

            if (visibleImages.length === 0) {
                return this;
            }

            firstImage = visibleImages[0].get('image');

            if (!firstImage) {
                return this;
            }

            this.canvas.width = firstImage.naturalWidth;
            this.canvas.height = firstImage.naturalHeight;
            this.$el.addClass('working');
            this.progressBar.value = 0;

            console.profile('getCombinedImageData');
            this.images.getCombinedImageData(function (data) {
                console.profileEnd();
                this.$el.removeClass('working');
                outputCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
