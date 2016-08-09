class Notifications {
    constructor() {
        this.enabled = true;
        this.timeout = 2000;
    }

    toggle(enabled) {
        if (enabled) {
            Notification.requestPermission();
        } else {
            this.enabled = false;
        }
    }

    notify(object) {
        // Set title if needed
        if( object.title == undefined ) {
            object.title = 'PokeStatus';
        }

        if( Notification.permission == 'granted' && this.enabled ) {

            // Create a new notification
            var notification = new Notification(object.title, {
                body: object.message
            });

            setTimeout(function(){
                notification.close();
            }, this.timeout);

        } else {
            console.log("Couldn't send user notification. Insufficient permissions." );
            console.log(object);
        }
    }
}
