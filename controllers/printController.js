const usb = require('usb');
const escpos = require('escpos');

escpos.USB = require('escpos-usb');

const printkot = (req, res) => {
    try {
        const { table, items, total } = req.body;

        if (!table || !items.length) {
            return res.status(400).json({ success: false, message: "Invalid data" });
        }

        // Initialize USB printer
        const device = new escpos.USB();
        const printer = new escpos.Printer(device);

       
        usb.usb.on('attach', (device) => {
            console.log('Printer Connected:', device);
        });
        
        usb.usb.on('detach', (device) => {
            console.log('Printer Disconnected:', device);
        });
        
        const devices = usb.getDeviceList();
        console.log('Connected Devices:', devices);


        // Open USB device
        device.open((err) => {
            if (err) {
                console.error("Printer connection error:", err);
                return res.status(500).json({ success: false, message: "Printer not connected" });
            }

            try {
                printer
                    .align("ct")
                    .style("b")
                    .size(1, 1)
                    .text("Restaurant Name")
                    .text("------------------------")
                    .style("normal")
                    .text(`Table: ${table}`)
                    .text("------------------------");

                items.forEach((item) => {
                    printer.text(`${item.quantity}x ${item.name} - ฿${item.price}`);
                });

                printer.text("------------------------");
                printer.style("b").text(`Total: ฿${total}`);
                printer.cut().close();

                return res.json({ success: true, message: "Print successful" });
            } catch (printError) {
                console.error("Print error:", printError);
                return res.status(500).json({ success: false, message: "Print failed" });
            }
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }

}


const printbill = (req, res) => {

}
module.exports = {
    printkot,
    printbill

}
