define([
    'backbone',
    'jquery',
    'mustache'
], function (
    Backbone,
    $,
    Mustache
) {
    var ImagesView = Backbone.View.extend({
        el: '.image-stack.pane',
        template: document.getElementById('template-stack-item').innerHTML,
        events: {
            'click .remove': 'removeImage',
            'change .toggle': 'toggleImageVisibility',
            'change #blending-mode': 'changeBlendingMode'
        },
        initialize: function (options) {
            this.images = options.images;
            this.preview = options.previewModel;

            this.elThumbnails = this.$('ol').get(0);
            this.elBlendingMode = document.querySelector('#blending-mode');

            this.listenTo(this.images, 'add remove reset', this.render);
            this.listenTo(this.images, 'change:thumbnailURL', this.updateThumb);
        },
        render: function () {
            this.$el.toggleClass('has-images', this.images.length > 0);
            this.elThumbnails.innerHTML = Mustache.render(
                this.template,
                { images: this.images.toJSON() }
            );

            return this;
        },
        updateThumb: function (model, url) {
            var $li = this.$('#thumbnail-' + model.id);
            var $image = $li.find('img');

            $image.attr('src', url);
            $li.toggleClass('loading', url === '');

        },

        removeImage: function (evt) {
            var id = evt.target.getAttribute('data-id');
            this.images.remove(id);
        },
        toggleImageVisibility: function (evt) {
            var visible = evt.target.checked;
            var id = evt.target.getAttribute('data-id');
            var model = this.images.findWhere({ id: id });
            model.set('visible', visible);
            $(evt.target).closest('li').toggleClass('using', visible);
        },
        changeBlendingMode: function () {
            this.preview.set('blendingMode', this.elBlendingMode.value);
        }

    });

    return ImagesView;
});
