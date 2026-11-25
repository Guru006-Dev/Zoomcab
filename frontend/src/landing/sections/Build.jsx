const FLOW = [
    ['Browsers', 'Riders and drivers'],
    ['nginx', 'Load balancer'],
    ['Three API instances', 'Express and Socket.IO, with leader election'],
    ['Redis and PostgreSQL', 'Geo index, locks and events. PostGIS holds the truth'],
];

export default function Build() {
    return (
        <section className="lp-section" aria-labelledby="build-title">
            <h2 id="build-title">How it is built</h2>
            <ol className="lp-flow">
                {FLOW.map(([name, detail]) => (
                    <li key={name}><strong>{name}</strong><span>{detail}</span></li>
                ))}
            </ol>
            <div className="lp-two">
                <div>
                    <h3>Checked on every push</h3>
                    <p>Backend tests run against Postgres, then against Postgres and Redis. The frontend is linted, tested and built.</p>
                </div>
                <div>
                    <h3>Known limits</h3>
                    <ul>
                        <li>Payments are simulated.</li>
                        <li>There is one Postgres instance with no replica.</li>
                        <li>The Docker cluster has not been run end to end.</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
