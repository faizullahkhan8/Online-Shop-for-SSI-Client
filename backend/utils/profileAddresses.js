export function profileAddresses(addresses) {
    if (!Array.isArray(addresses)) throw new Error("Addresses must be a list");
    return addresses.map(address => {
        if (!address || typeof address !== "object" || Array.isArray(address)) throw new Error("Invalid address");
        const result = {};
        for (const field of ["street", "addressLine2", "city", "state", "postalCode", "country"]) {
            if (address[field] !== undefined && typeof address[field] !== "string") throw new Error(`Invalid address ${field}`);
            result[field] = address[field] || "";
        }
        for (const [field, maximum] of [["lat", 90], ["lng", 180]]) {
            if (address[field] === undefined || address[field] === null || address[field] === "") continue;
            if (!["number", "string"].includes(typeof address[field])) throw new Error(`Invalid address ${field}`);
            const value = Number(address[field]);
            if (!Number.isFinite(value) || Math.abs(value) > maximum) throw new Error(`Invalid address ${field}`);
            result[field] = value;
        }
        if ((result.lat === undefined) !== (result.lng === undefined)) throw new Error("Both latitude and longitude are required");
        return result;
    });
}
