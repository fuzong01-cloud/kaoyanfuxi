// Printed page and file page are recorded separately after visual inspection.
// These checks support the stated concepts, not the entire answer or every book page.
export const evidence={
 'g-inter':[{source:'book-g',location:'第8章 8.3.1，书页216—217 / PDF第225—226页',note:'已核对间作、混作、套作定义。比较时抓住行带安排和共生期：间作、混作侧重空间利用；套作在前茬后期引入后茬，争取时间。该书进一步以共生期占全生育期的比例解释间作与套作差别。不能只看“是否同一块地”。'}],
 'i-rs':[{source:'book-i',location:'第2章 2.4.1，书页79—81 / PDF第91—93页',note:'已核对遥感利用地物电磁特征获取信息的基本机制，以及作物长势、冠层和土壤水分监测应用。遥感输出需要经过处理与解释；书中具体设备参数和发展现状不能直接视为2027年的现状。'}],
 'i-gps':[{source:'book-i',location:'第2章 2.4.2，书页81 / PDF第93页',note:'已核对GPS的空间卫星、地面监控、用户接收机三部分，以及农业数据定位的作用。只取基本结构作辅助依据，不要求照背旧版中的卫星数量、地面站数量等历史配置。'}],
 'i-expert':[{source:'book-i',location:'第6章 6.3.1，书页256—257 / PDF第268—269页',note:'已核对专家系统以知识和推理解决领域问题的机制。书中列出人机交互界面、知识库、推理机、解释器、综合数据库和知识获取，并强调知识库与推理机。此页核对仅支持专家系统部分，不能外推为决策支持系统全部内容已核实。'}],
 'a-training':[{source:'mindmap',location:'PDF第1—3页，训练流程与优化手写批注',note:'已阅读图中训练流程、学习率、正则化和批次的笔记。注意：学习率影响参数更新步长，不是训练轮数；训练/验证/测试划分比例只是示例。梯度是损失对参数的偏导向量，优化器根据梯度更新参数。原图把批归一化效果完全归因于“内部协变量偏移”，不宜照抄为唯一机制。'}],
 'a-cnn':[{source:'mindmap',location:'PDF第1—2页，CNN与池化笔记',note:'图中关于“平移不变性”的表述应加条件：卷积通常具有平移等变的结构特点，池化能提供一定局部鲁棒性；不能推导出整个网络天然完全平移不变或尺度不变。'}],
 'a-transformer':[{source:'mindmap',location:'PDF第2—3页，大模型与RLHF练习',note:'图中把RLHF作为幻觉问题的一项选择答案。复习时应理解：RLHF主要利用人类偏好反馈调整行为，不保证事实正确，也不是消除幻觉的通用保证。实际回答需要联系可靠检索、证据核查、评估及人工复核。'}],
 'a-application':[{source:'mindmap',location:'PDF第4页，果园案例与混淆矩阵',note:'图中数值例：TP=42、TN=62、FP=8、FN=8。Accuracy=(42+62)/120≈86.67%；Precision=42/(42+8)=84%；Recall=42/(42+8)=84%；F1=84%。这次精确率与召回率相同是因为FP=FN，不能记成两个指标永远相等。病虫识别还需区分分类、检测、分割的任务目标。'}]
};
