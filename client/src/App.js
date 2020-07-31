import React, { useEffect, useState, useMemo } from 'react';
import './App.css';
import { Card, Row, Col, Layout, Switch, Empty, Tooltip } from 'antd';
import "antd/dist/antd.css";
import moment from 'moment-timezone'

const { Header, Content, Footer } = Layout;

const last24Hours = moment().subtract(24, 'hour');
const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverTimeZone = 'America/New_York';

const cardBgColorByWbKind = {
  'ony': '#B54055',
  'nef': '#B54055',
  'hakkar': '#77CBB9',
  'rend': '#75B8C8'
}

function App() {

  const [worldBuffs, setWorldBuffs] = useState([]);
  const [isServerTime, setIsServerTime] = useState(true);

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/worldBuffs');
      const worldBuffs = await response.json();
      setWorldBuffs(worldBuffs.map(x => {
        return {
          ...x,
          when: new Date(x.when),
        }
      }));
    })();
  }, []);

  const previousWorldBuffs = useMemo(() =>
    worldBuffs.map(x => {
      return { ...x, when: isServerTime ? x.when : new Date(new Date(x.when).toLocaleString(undefined, { timeZone: localTimeZone })) }
    })
      .sort((a, b) => b.when - a.when)
      .filter(x => x.when > last24Hours && x.when < moment())
      .map(x => {
        return (worldBuffCard(x, isServerTime, false))
      }),
    [isServerTime, worldBuffs]
  );

  const nextWorldBuffs = useMemo(() =>
    worldBuffs.map(x => {
      return { ...x, when: isServerTime ? x.when : new Date(new Date(x.when).toLocaleString(undefined, { timeZone: localTimeZone })) }
    })
      .sort((a, b) => a.when - b.when)
      .filter(x => x.when > moment())
      .map(x => {
        return (worldBuffCard(x, isServerTime))
      }),
    [isServerTime, worldBuffs]
  );

  return (
    <Layout>
      <Header style={{ color: 'white' }}>
        <Row>
          <Col flex={'auto'}>
            Earthfury World Buffs
          </Col>
          <Col flex={'100px'}>
            <Switch
              checked={isServerTime}
              onChange={() => setIsServerTime(!isServerTime)}
              checkedChildren={"Server Time"}
              unCheckedChildren={"Local Time"}
            />
          </Col>
        </Row>
      </Header>
      <Content style={{ padding: '25px' }}>
        <Row gutter={[48 * 2, 24]}>
          <Col flex={1}>
            <h4>Coming up</h4>
            {nextWorldBuffs.length ? nextWorldBuffs : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Col>
          <Col flex={1}>
            <h4>Last 24 hrs</h4>
            {previousWorldBuffs.length ? previousWorldBuffs : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Col>
        </Row>
      </Content>
      <Footer style={{ textAlign: 'center' }}></Footer>
    </Layout>
  );
}

function worldBuffCard(worldBuff, isServerTime, displayRemindMe = true) {
  return (
    <Card
      key={worldBuff.meta.timestamp}
      title={<span style={{ textTransform: 'uppercase' }}>{worldBuff.kind}</span>}
      extra={displayRemindMe && <a href={remindMeLink(worldBuff.kind, worldBuff.when)} target="blank">Remind me</a>}
      headStyle={{ border: 0 }}
      style={{ backgroundColor: cardBgColorByWbKind[worldBuff.kind], filter: 'grayscale(30%)' }}
    >
      <Tooltip title={`${worldBuff.meta.username}: ${worldBuff.meta.original}`} placement="rightBottom">
        <p>{formatDate(worldBuff.when, isServerTime)}</p>
      </Tooltip>
    </Card>
  )
}

function formatDate(date, isServerTime) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'long', hour: 'numeric', minute: 'numeric',
    timeZone: isServerTime ? serverTimeZone : localTimeZone
  })
}

function remindMeLink(title, date) {
  return `https://vclock.com/timer/#date=${moment(date, { timeZone: localTimeZone }).format('YYYY-MM-DDTHH:mm')}&title=${title.toUpperCase()}+&sound=classic&loop=0`
}

export default App;
