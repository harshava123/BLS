import React from "react"

export function TransportReceipt({ data }) {
  const {
    companyName,
    branchAddress,
    meta,
    consignor,
    consignee,
    remarks,
    deliveryAt,
    contact,
    charges,
  } = data

  return (
    <div className="receipt-card avoid-break border-2 border-black p-4 print:border-black max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-4 border-2 border-black p-3">
        <h1 className="text-xl font-bold mb-2">{companyName}</h1>
        <p className="text-xs">{branchAddress}</p>
        <p className="text-xs font-medium mt-2 border-t border-black pt-2">
          <strong>From Location Address:</strong> {consignor.location}
        </p>
      </div>

      {/* Receipt Header */}
      <div className="flex justify-between items-center mb-4 border-2 border-black p-2">
        <div className="text-xs border-r-2 border-black pr-3 flex-1">
          <div>Parcel Receipt</div>
          <div className="font-bold">L.R.No: {meta.lrNo}</div>
        </div>
        <div className="text-xs text-center border-r-2 border-black px-3 flex-1">
          <div className="font-bold">Date: {meta.dateTime}</div>
        </div>
        <div className="text-xs text-right pl-3 flex-1">
          <div className="font-bold">{meta.toPay ? "To-Pay" : ""}</div>
        </div>
      </div>

      {/* Main Receipt Table */}
      <table className="w-full border-collapse border-2 border-black text-xs mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-2 border-black p-2 text-left font-bold">Consignor:</th>
            <th className="border-2 border-black p-2 text-left font-bold">Consignee:</th>
            <th className="border-2 border-black p-2 text-left font-bold">{meta.copyType}</th>
          </tr>
        </thead>
        <tbody>
          {/* Row 1: Customer Names and Package Details */}
          <tr>
            <td className="border-2 border-black p-2">{consignor.name}</td>
            <td className="border-2 border-black p-2">{consignee.name}</td>
            <td className="border-2 border-black p-2">Pkgs: {meta.pkgs}</td>
          </tr>
          
          {/* Row 2: From/To Locations */}
          <tr>
            <td className="border-2 border-black p-2">
              From: {consignor.location}
            </td>
            <td className="border-2 border-black p-2">
              To: {consignee.location}
            </td>
            <td className="border-2 border-black p-2"></td>
          </tr>
          
          {/* Row 3: Invoice Number and Parcel Value */}
          <tr>
            <td className="border-2 border-black p-2">Invoice Number: {consignor.invoiceNumber || ''}</td>
            <td className="border-2 border-black p-2">Parcel Value: {consignee.parcelValue}</td>
            <td className="border-2 border-black p-2"></td>
          </tr>
          
          {/* Row 4: GST Numbers */}
          <tr>
            <td className="border-2 border-black p-2">GST Number: {consignor.gst || ''}</td>
            <td className="border-2 border-black p-2">GST Number: {consignee.gst || ''}</td>
            <td className="border-2 border-black p-2"></td>
          </tr>
          
          {/* Row 5: Terms & Conditions + Weight/Financial Table */}
          <tr>
            <td className="border-2 border-black p-2 align-top" colSpan="2">
              <div className="font-bold mb-2">Terms & Conditions:</div>
              <div className="text-xs space-y-1">
                {remarks.map((remark, index) => (
                  <div key={index}><strong>{remark}</strong></div>
                ))}
              </div>
            </td>
            <td className="border-2 border-black p-2 align-top">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-2 border-black px-2 py-1 text-left font-semibold">Weight</th>
                    <th className="border-2 border-black px-2 py-1 text-left font-semibold">Actual Wt.</th>
                    <th className="border-2 border-black px-2 py-1 text-left font-semibold">Charged Wt.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-2 border-black px-2 py-1"></td>
                    <td className="border-2 border-black px-2 py-1 text-right">{charges.weightActual}</td>
                    <td className="border-2 border-black px-2 py-1 text-right">{charges.weightCharged}</td>
                  </tr>
                  <tr>
                    <td className="border-2 border-black px-2 py-1 font-medium">Freight</td>
                    <td className="border-2 border-black px-2 py-1" colSpan={2}>
                      <span className="float-right">{charges.freight}</span>
                    </td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="border-2 border-black px-2 py-1 font-semibold">Net Amt Payable</td>
                    <td className="border-2 border-black px-2 py-1 font-semibold" colSpan={2}>
                      <span className="float-right">{charges.netAmount}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Delivery Address */}
      <div className="text-xs mb-4 p-2 border-2 border-black">
        <div>
          <strong>Delivery at:</strong> {deliveryAt}
        </div>
        <div className="mt-1">
          <strong>Contact:</strong> {contact}
        </div>
      </div>

      {/* Signature Section */}
      <div className="flex justify-end border-2 border-black p-2">
        <div className="text-xs text-right">
          <div className="font-bold">Receiver&apos;s Signature/Name</div>
          <div className="h-12 w-40 border-b-2 border-black mt-2"></div>
        </div>
      </div>
    </div>
  )
}
