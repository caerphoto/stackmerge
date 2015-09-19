define([
    'backbone'
], function (
    Backbone
) {
    // Simple model that serves as a base for others.
    var BaseModel = Backbone.Model.extend({
        increment: function (attribute, byAmount) {
            this.set(attribute, this.get(attribute) + (byAmount || 1));
        }
    });

    return BaseModel;
});
