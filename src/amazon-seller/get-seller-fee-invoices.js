(async function () {

	try {

		if (!window.location.href.match(/seller-fee-invoices/ig)) {
			throw({code: "f31508c5-976d-4fbc-8bf3-a8754f5ab27b", message: "wrong website"});
		  }

		const now = new Date();

		let year = now.getFullYear();
		year = window.prompt("Which year?", year);
		if (!year) throw({code: "f7b0e4cf-3c04-4e44-9055-61dc8bc363ba", message: "user aborted"})

		year = parseInt(year);
		console.log("selected year", year);




		let month = now.getMonth() + 1 - 1; // to preselct previous month
		month = window.prompt("Which month? (Normally last month)", month);
		if (!month) throw({code: "039f1a33-804d-4083-a5f2-c2e709cd2437", message: "user aborted"})
		month = parseInt(month);
		console.log("selected month", month);

		// to match javascript specification January is 0
		month = month - 1;




		const rows = document.querySelectorAll("[modelattribute='SellerFeeInvoicesForm'] div table tbody tr");

		const invoices = [];

		for (let row of rows) {

			const invoice = {};

			const cells = row.querySelectorAll("td");

			for (let [index, cell] of cells.entries()) {
				switch (index) {
					case 3:
						invoice.type = cell.innerText;
						break
					case 10:
						invoice.marketplace = cell.innerText;
						break;
					case 11:
						invoice.dateStart = new Date(cell.innerText.trim());
						break;
					case 12:
						invoice.dateEnd = new Date(cell.innerText.trim());
						break;
				}

			}

			const button = row.querySelector("#view_invoice_button-announce");


			for (let attribute of button.attributes) {
				// const item = attribute.item;
				// console.log(JSON.stringify(attribute, null, 2));

				if (attribute.name.match(/^data-/)) {
					invoice[attribute.name] = attribute.value;
				}

				if (attribute.name === "value") {
					invoice["urn"] = attribute.value;
				}

			}


			invoices.push(invoice);

		}


		console.log("invoices");
		console.log(invoices);


		const downloadInvoices = [];


		for await (let [index, invoice] of invoices.entries()) {

			// not the right timefame
			if (invoice.dateStart.getUTCMonth() !== month || invoice.dateStart.getUTCFullYear() !== year) {
				continue;
			}

			// not the right timefame
			if (invoice.dateEnd.getUTCMonth() !== month || invoice.dateEnd.getUTCFullYear() !== year) {
				continue;
			}


			const body = `{"documentVersionId":"${invoice.urn}","fileType":"${invoice['data-filetype']}","vatInvoiceNumber":"${invoice['data-invoice']}","endDate":"${invoice['data-enddate']}","payeeRegistrationNumber":"${invoice['data-payeeregistrationnumber']}","filterName":"${invoice['data-filtername']}"}`


			const res = await fetch('https://sellercentral-europe.amazon.com/tax/view-seller-fee-invoice-execute', {
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				body
			});

			const { url } = await res.json();

			console.log(url);

			downloadInvoices.push({
				fileName: `${year}-${String(month+1).padStart(2, '0')}_${invoice.marketplace.toLowerCase()}_${invoice.type}_${invoice['data-invoice']}.pdf`.replace(/\s/g, "_"),
				url
			});

		}


		console.log("downloadInvoices");
		console.log(downloadInvoices);


		for await (let downloadInvoice of downloadInvoices) {

			res = await fetch(downloadInvoice.url);

			const blob = await res.blob();

			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.style.display = 'none';
			a.href = url;
			// the filename you want
			a.download = downloadInvoice.fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);

		}


		return true;


	} catch (error) {

		console.log(error);

		window.alert(JSON.stringify(error, null, 2));

		throw (error);

	}

})().then(success => console.log("success")).catch(error => console.log("error"));
